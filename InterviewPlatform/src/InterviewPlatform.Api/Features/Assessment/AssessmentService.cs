using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Domain.Enums;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Assessment;

public class AssessmentService(AppDbContext db, IAuditService audit)
{
    public async Task SaveScoresAsync(Guid interviewId, SaveScoresRequest req, CancellationToken ct)
    {
        var interview = await db.Interviews.Include(i => i.Scores)
            .FirstOrDefaultAsync(i => i.Id == interviewId, ct)
            ?? throw new NotFoundException("Собеседование не найдено");

        foreach (var s in req.Scores)
        {
            if (s.Score is < 1 or > 5)
                throw new ValidationException("Оценка должна быть в диапазоне 1..5");

            var existing = interview.Scores.FirstOrDefault(x => x.CompetencyId == s.CompetencyId);
            if (existing is null)
                interview.Scores.Add(new CompetencyScore
                {
                    Id = Guid.NewGuid(), InterviewId = interviewId,
                    CompetencyId = s.CompetencyId, Score = s.Score, Comment = s.Comment,
                });
            else { existing.Score = s.Score; existing.Comment = s.Comment; }
        }

        if (req.Summary is not null) interview.Summary = req.Summary;
        if (interview.Status == InterviewStatus.Planned) interview.Status = InterviewStatus.Completed;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(nameof(Candidate), interview.CandidateId, "ScoresSaved", new { interviewId }, ct);
    }

    public async Task<ProtocolDto> GetProtocolAsync(Guid interviewId, CancellationToken ct)
    {
        var i = await db.Interviews.AsNoTracking()
            .Include(x => x.Candidate).Include(x => x.Vacancy)
            .Include(x => x.Scores).ThenInclude(s => s.Competency)
            .Include(x => x.Decision)
            .FirstOrDefaultAsync(x => x.Id == interviewId, ct)
            ?? throw new NotFoundException("Собеседование не найдено");

        var lines = i.Scores
            .Select(s => new ScoreLine(s.CompetencyId, s.Competency.Name, s.Score, s.Comment))
            .OrderBy(l => l.CompetencyName).ToList();
        var avg = lines.Count > 0 ? Math.Round(lines.Average(l => l.Score), 2) : 0;

        return new ProtocolDto(i.Id, i.Candidate.FullName, i.Vacancy.Title, i.ScheduledAt,
            i.Status, i.Summary, avg, lines, i.Decision?.DecisionType.ToString());
    }
}
