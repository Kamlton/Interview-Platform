using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Domain.Enums;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Interviews;

public class InterviewService(AppDbContext db, IAuditService audit)
{
    public async Task<PagedResult<InterviewListItem>> GetRegistryAsync(
        PageQuery q, Guid? candidateId, Guid? vacancyId, CancellationToken ct)
    {
        var query = db.Interviews.AsNoTracking().Where(i => !i.IsArchived);
        if (candidateId is { } cid) query = query.Where(i => i.CandidateId == cid);
        if (vacancyId is { } vid) query = query.Where(i => i.VacancyId == vid);
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(i => EF.Functions.ILike(i.Candidate.FullName, $"%{s}%")
                                  || EF.Functions.ILike(i.Vacancy.Title, $"%{s}%"));
        }
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(i => i.ScheduledAt)
            .Skip(q.Skip).Take(q.Size)
            .Select(i => new InterviewListItem(i.Id, i.Candidate.FullName, i.Vacancy.Title,
                i.Interviewer.FullName, i.ScheduledAt, i.Status))
            .ToListAsync(ct);
        return new PagedResult<InterviewListItem>(items, total, q.Page, q.Size);
    }

    public async Task<InterviewDetails> GetAsync(Guid id, CancellationToken ct)
    {
        var i = await db.Interviews.AsNoTracking()
            .Include(x => x.Candidate).Include(x => x.Vacancy).Include(x => x.Interviewer)
            .FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Собеседование не найдено");
        return new InterviewDetails(i.Id, i.CandidateId, i.Candidate.FullName, i.VacancyId, i.Vacancy.Title,
            i.Interviewer.FullName, i.MatrixId, i.Plan, i.ScheduledAt, i.Status, i.Summary, i.IsArchived);
    }

    public async Task<InterviewDetails> CreateAsync(CreateInterviewRequest req, CancellationToken ct)
    {
        if (!await db.Candidates.AnyAsync(c => c.Id == req.CandidateId, ct))
            throw new NotFoundException("Кандидат не найден");
        if (!await db.Vacancies.AnyAsync(v => v.Id == req.VacancyId, ct))
            throw new NotFoundException("Вакансия не найдена");
        if (req.MatrixId is { } mid && !await db.CompetencyMatrices.AnyAsync(m => m.Id == mid, ct))
            throw new NotFoundException("Матрица не найдена");

        await EnsureNoScheduleConflictAsync(req.VacancyId, req.ScheduledAt, excludeInterviewId: null, ct);

        var interview = new Interview
        {
            Id = Guid.NewGuid(),
            CandidateId = req.CandidateId,
            VacancyId = req.VacancyId,
            InterviewerUserId = req.InterviewerUserId,
            MatrixId = req.MatrixId,
            Plan = req.Plan,
            ScheduledAt = req.ScheduledAt,
        };
        db.Interviews.Add(interview);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(nameof(Candidate), req.CandidateId, "InterviewCreated", new { interview.Id }, ct);
        return await GetAsync(interview.Id, ct);
    }

    static readonly TimeSpan InterviewDuration = TimeSpan.FromHours(1);

    async Task EnsureNoScheduleConflictAsync(
        Guid vacancyId, DateTimeOffset scheduledAt, Guid? excludeInterviewId, CancellationToken ct)
    {
        // Эквивалент пересечения [scheduledAt, scheduledAt+1ч) и [i.ScheduledAt, i.ScheduledAt+1ч),
        // но без .Add() в LINQ — EF Core не переводит DateTimeOffset.Add в SQL.
        var windowStart = scheduledAt.Subtract(InterviewDuration);
        var windowEnd = scheduledAt.Add(InterviewDuration);

        var conflict = await db.Interviews.AsNoTracking()
            .Where(i => i.VacancyId == vacancyId && !i.IsArchived && i.Status != InterviewStatus.Cancelled)
            .Where(i => excludeInterviewId == null || i.Id != excludeInterviewId)
            .AnyAsync(i => i.ScheduledAt > windowStart && i.ScheduledAt < windowEnd, ct);

        if (conflict)
            throw new ConflictException(
                "Выбранное время пересекается с другим собеседованием по этой вакансии. " +
                "Между собеседованиями должен быть перерыв минимум 1 час.");
    }
}
