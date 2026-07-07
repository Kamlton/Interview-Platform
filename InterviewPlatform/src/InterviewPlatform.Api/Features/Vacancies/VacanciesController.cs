using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Vacancies;

public record VacancyDto(
    Guid Id, 
    string Title, 
    string? Level,
    string? Description,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string? Experience,
    string? Schedule,
    int? WorkHours,
    string? WorkFormat,
    string Status, 
    bool IsArchived
);
public record CompetencyRequest(
    string Name, 
    string? Category, 
    string? Description, 
    int Weight);
public record SaveVacancyRequest(
    string Title,
    string? Level,
    string? Description,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string? Experience,
    string? Schedule,
    int? WorkHours,
    string? WorkFormat,
    string? Status,
    List<CompetencyRequest>? Competencies);

[ApiController]
[Route("api/vacancies")]
[Authorize(Policy = Policies.HrOrAdmin)]
public class VacanciesController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<VacancyDto>> List([FromQuery] bool includeArchived = false, CancellationToken ct = default) =>
        await db.Vacancies.AsNoTracking().Where(v => includeArchived || !v.IsArchived)
            .OrderBy(v => v.Title)
            .Select(v => new VacancyDto(
                v.Id, v.Title, v.Level, 
                v.Description, v.SalaryFrom, 
                v.SalaryTo, v.Experience, v.Schedule, 
                v.WorkHours, v.WorkFormat, v.Status, v.IsArchived))
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
        Level = req.Level,
        Description = req.Description, 
        SalaryFrom = req.SalaryFrom,
        SalaryTo = req.SalaryTo,
        Experience = req.Experience,
        Schedule = req.Schedule,
        WorkHours = req.WorkHours,
        WorkFormat = req.WorkFormat,
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
    return Ok(new VacancyDto(v.Id, v.Title, v.Level, v.Description, v.SalaryFrom, v.SalaryTo, v.Experience,
        v.Schedule, v.WorkHours, v.WorkFormat, v.Status, false));
    }

    [HttpPut("{id:guid}")]
    public async Task<VacancyDto> Update(Guid id, SaveVacancyRequest req, CancellationToken ct)
    {
        var v = await db.Vacancies
            .Include(x => x.Matrices)
                .ThenInclude(m => m.Items)
            .FirstOrDefaultAsync(x => x.Id == id, ct) 
            ?? throw new NotFoundException("Вакансия не найдена");
        
        v.Title = req.Title; 
        v.Level = req.Level;
        v.Description = req.Description;
        v.SalaryFrom = req.SalaryFrom;
        v.SalaryTo = req.SalaryTo;
        v.Experience = req.Experience;
        v.Schedule = req.Schedule;
        v.WorkHours = req.WorkHours;
        v.WorkFormat = req.WorkFormat; 
        v.Status = req.Status ?? v.Status;
        
        var existingMatrices = v.Matrices.ToList();
        foreach (var matrix in existingMatrices)
        {
            db.MatrixCompetencies.RemoveRange(matrix.Items);
            db.CompetencyMatrices.Remove(matrix);
        }
        
        if (req.Competencies != null && req.Competencies.Any(c => !string.IsNullOrWhiteSpace(c.Name)))
        {
            var matrix = new CompetencyMatrix
            {
                Id = Guid.NewGuid(),
                Title = $"Матрица для {v.Title}",
                VacancyId = v.Id,
                CreatedByUserId = currentUser.Id ?? Guid.Empty,
                CreatedAt = DateTimeOffset.UtcNow
            };
            
            foreach (var c in req.Competencies.Where(c => !string.IsNullOrWhiteSpace(c.Name)))
            {
                var comp = await db.Competencies.FirstOrDefaultAsync(x => x.Name == c.Name, ct);
                if (comp == null)
                {
                    comp = new Competency
                    {
                        Id = Guid.NewGuid(),
                        Name = c.Name.Trim(),
                        Category = c.Category,
                        Description = c.Description
                    };
                    db.Competencies.Add(comp);
                }
                else
                {
                    if (!string.IsNullOrEmpty(c.Category))
                    {
                        comp.Category = c.Category;
                    }
                }
                
                matrix.Items.Add(new MatrixCompetency
                {
                    MatrixId = matrix.Id,
                    CompetencyId = comp.Id,
                    Weight = c.Weight > 0 ? c.Weight : 1
                });
            }
            
            if (matrix.Items.Any())
            {
                db.CompetencyMatrices.Add(matrix);
            }
        }
        
        await db.SaveChangesAsync(ct);
        
        return new VacancyDto(
            v.Id, v.Title, v.Level, v.Description,
            v.SalaryFrom, v.SalaryTo, v.Experience,
            v.Schedule, v.WorkHours, v.WorkFormat,
            v.Status, v.IsArchived);
    }
}

