using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Features.Audit;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Competencies;

public record CompetencyDto(Guid Id, string Name, string? Category, string? Description);
public record SaveCompetencyRequest(string Name, string? Category, string? Description);

[ApiController]
[Route("api/competencies")]
[Authorize(Policy = Policies.HrOrAdmin)]
public class CompetenciesController(AppDbContext db, IUserActionAuditService userAudit) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<CompetencyDto>> List(CancellationToken ct) =>
        await db.Competencies.AsNoTracking().OrderBy(c => c.Name)
            .Select(c => new CompetencyDto(c.Id, c.Name, c.Category, c.Description)).ToListAsync(ct);

    [HttpPost]
    public async Task<ActionResult<CompetencyDto>> Create(SaveCompetencyRequest req, CancellationToken ct)
    {
        var c = new Competency { Id = Guid.NewGuid(), Name = req.Name, Category = req.Category,
                                 Description = req.Description };
        db.Competencies.Add(c);
        await db.SaveChangesAsync(ct);
        await userAudit.LogCurrentUserAsync($"Создана компетенция «{c.Name}»", "/vacancies");
        return Ok(new CompetencyDto(c.Id, c.Name, c.Category, c.Description));
    }
}
