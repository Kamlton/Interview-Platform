using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Candidates;

public class CandidateService(AppDbContext db, ICurrentUser currentUser, IAuditService audit)
{
    public async Task<PagedResult<CandidateListItem>> GetRegistryAsync(
        PageQuery q, bool includeArchived, CancellationToken ct)
    {
        var query = db.Candidates.AsNoTracking().Where(c => includeArchived || !c.IsArchived);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(c => EF.Functions.ILike(c.FullName, $"%{s}%")
                                  || (c.City != null && EF.Functions.ILike(c.City, $"%{s}%")));
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(c => c.CreatedAt)
            .Skip(q.Skip).Take(q.Size)
            .Select(c => new CandidateListItem(c.Id, c.FullName, c.City, c.Status, c.IsArchived))
            .ToListAsync(ct);

        return new PagedResult<CandidateListItem>(items, total, q.Page, q.Size);
    }

    public async Task<CandidateDetails> GetAsync(Guid id, CancellationToken ct)
    {
        var c = await db.Candidates.AsNoTracking()
            .Include(x => x.CandidateSkills).ThenInclude(cs => cs.Skill)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Кандидат не найден");
        return Map(c);
    }

    public async Task<CandidateDetails> CreateAsync(SaveCandidateRequest req, CancellationToken ct)
    {
        var candidate = new Candidate
        {
            Id = Guid.NewGuid(),
            FullName = req.FullName,
            Phone = req.Phone,
            City = req.City,
            Education = req.Education,
            PreviousWorkplace = req.PreviousWorkplace,
            CreatedByUserId = currentUser.Id ?? throw new ValidationException("Нет текущего пользователя"),
        };
        await ApplySkillsAsync(candidate, req.Skills, ct);
        db.Candidates.Add(candidate);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(nameof(Candidate), candidate.Id, "Create", new { req.FullName }, ct);
        return await GetAsync(candidate.Id, ct);
    }

    public async Task<CandidateDetails> UpdateAsync(Guid id, SaveCandidateRequest req, CancellationToken ct)
    {
        var c = await db.Candidates.Include(x => x.CandidateSkills)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Кандидат не найден");

        c.FullName = req.FullName; c.Phone = req.Phone; c.City = req.City;
        c.Education = req.Education; c.PreviousWorkplace = req.PreviousWorkplace;
        c.CandidateSkills.Clear();
        await ApplySkillsAsync(c, req.Skills, ct);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(nameof(Candidate), c.Id, "Update", null, ct);
        return await GetAsync(c.Id, ct);
    }

    public async Task ArchiveAsync(Guid id, bool archived, CancellationToken ct)
    {
        var c = await db.Candidates.FindAsync([id], ct) ?? throw new NotFoundException("Кандидат не найден");
        c.IsArchived = archived;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(nameof(Candidate), c.Id, archived ? "Archive" : "Restore", null, ct);
    }

    private async Task ApplySkillsAsync(Candidate candidate, List<string>? skills, CancellationToken ct)
    {
        foreach (var name in (skills ?? []).Select(s => s.Trim()).Where(s => s.Length > 0).Distinct())
        {
            var skill = await db.Skills.FirstOrDefaultAsync(s => s.Name == name, ct);
            if (skill is null)
            {
                skill = new Skill { Id = Guid.NewGuid(), Name = name };
                db.Skills.Add(skill);
            }
            candidate.CandidateSkills.Add(new CandidateSkill { Candidate = candidate, Skill = skill });
        }
    }

    private static CandidateDetails Map(Candidate c) => new(
        c.Id, c.FullName, c.Phone, c.City, c.Education, c.PreviousWorkplace,
        c.Status, c.IsArchived, c.CandidateSkills.Select(s => s.Skill.Name).ToList());
}
