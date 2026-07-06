using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Vacancies;

public record VacancyDto(Guid Id, string Title, string? Description, string Status, bool IsArchived);
public record CompetencyRequest(string Name, string? Category, string? Description, int Weight);
public record SaveVacancyRequest(string Title, string? Description, string? Status, List<CompetencyRequest>? Competencies);

[ApiController]
[Route("api/vacancies")]
[Authorize(Policy = Policies.HrOrAdmin)]
public class VacanciesController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<VacancyDto>> List([FromQuery] bool includeArchived = false, CancellationToken ct = default) =>
        await db.Vacancies.AsNoTracking().Where(v => includeArchived || !v.IsArchived)
            .OrderBy(v => v.Title)
            .Select(v => new VacancyDto(v.Id, v.Title, v.Description, v.Status, v.IsArchived))
            .ToListAsync(ct);

    [HttpGet("{vacancyId:guid}/competencies")]
    public async Task<ActionResult<List<Competency>>> GetCompetenciesForVacancy(Guid vacancyId, CancellationToken ct)
    {
        var competencies = await db.CompetencyMatrices
            .Where(m => m.VacancyId == vacancyId)
            .SelectMany(m => m.Items)
            .Select(i => i.Competency)
            .Distinct()
            .ToListAsync(ct);
            
        return Ok(competencies);
    }

    [HttpPost]
    public async Task<ActionResult<VacancyDto>> Create(SaveVacancyRequest req, CancellationToken ct)
    {
        var v = new Vacancy { 
        Id = Guid.NewGuid(), 
        Title = req.Title, 
        Description = req.Description, 
        Status = req.Status ?? "Open" 
    };
    db.Vacancies.Add(v);
    
    if (req.Competencies != null && req.Competencies.Any()) {
        var matrix = new CompetencyMatrix { 
            Id = Guid.NewGuid(), 
            Title = $"Матрица для {v.Title}", 
            VacancyId = v.Id,
            CreatedByUserId = currentUser.Id ?? Guid.Empty
        };
        foreach (var c in req.Competencies) {
            var comp = await db.Competencies.FirstOrDefaultAsync(x => x.Name == c.Name, ct);
            if (comp == null) {
                comp = new Competency { 
                    Id = Guid.NewGuid(), 
                    Name = c.Name,
                    Category = c.Category, 
                    Description = c.Description
                };
                db.Competencies.Add(comp);
            } else {
                if (!string.IsNullOrEmpty(c.Category)) {
                    comp.Category = c.Category;
                }
            }
            if (comp.Id == Guid.Empty) comp.Id = Guid.NewGuid();
            if (db.Entry(comp).State == EntityState.Detached) db.Competencies.Add(comp);
            
            matrix.Items.Add(new MatrixCompetency { 
                MatrixId = matrix.Id, 
                CompetencyId = comp.Id, 
                Weight = c.Weight > 0 ? c.Weight : 1
            });
        }
        db.CompetencyMatrices.Add(matrix);
    }
    
    await db.SaveChangesAsync(ct);
    return Ok(new VacancyDto(v.Id, v.Title, v.Description, v.Status, false));
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
