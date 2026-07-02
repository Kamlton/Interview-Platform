using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Vacancies;

public record VacancyDto(Guid Id, string Title, string? Description, string Status, bool IsArchived);
public record SaveVacancyRequest(string Title, string? Description, string? Status);

[ApiController]
[Route("api/vacancies")]
[Authorize(Policy = Policies.HrOrAdmin)]
public class VacanciesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<VacancyDto>> List([FromQuery] bool includeArchived = false, CancellationToken ct = default) =>
        await db.Vacancies.AsNoTracking().Where(v => includeArchived || !v.IsArchived)
            .OrderBy(v => v.Title)
            .Select(v => new VacancyDto(v.Id, v.Title, v.Description, v.Status, v.IsArchived))
            .ToListAsync(ct);

    [HttpPost]
    public async Task<ActionResult<VacancyDto>> Create(SaveVacancyRequest req, CancellationToken ct)
    {
        var v = new Vacancy { Id = Guid.NewGuid(), Title = req.Title, Description = req.Description,
                              Status = req.Status ?? "Open" };
        db.Vacancies.Add(v);
        await db.SaveChangesAsync(ct);
        return Ok(new VacancyDto(v.Id, v.Title, v.Description, v.Status, v.IsArchived));
    }

    [HttpPut("{id:guid}")]
    public async Task<VacancyDto> Update(Guid id, SaveVacancyRequest req, CancellationToken ct)
    {
        var v = await db.Vacancies.FindAsync([id], ct) ?? throw new NotFoundException("Вакансия не найдена");
        v.Title = req.Title; v.Description = req.Description; v.Status = req.Status ?? v.Status;
        await db.SaveChangesAsync(ct);
        return new VacancyDto(v.Id, v.Title, v.Description, v.Status, v.IsArchived);
    }
}
