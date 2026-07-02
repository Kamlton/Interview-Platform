using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Matrices;

public record MatrixItemDto(Guid CompetencyId, string CompetencyName, int Weight);
public record MatrixDto(Guid Id, string Title, Guid? VacancyId, IReadOnlyList<MatrixItemDto> Items);
public record MatrixItemInput(Guid CompetencyId, int Weight);
public record SaveMatrixRequest(string Title, Guid? VacancyId, List<MatrixItemInput> Items);

[ApiController]
[Route("api/matrices")]
[Authorize(Policy = Policies.HrOrAdmin)]
public class MatricesController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<MatrixDto> Get(Guid id, CancellationToken ct)
    {
        var m = await db.CompetencyMatrices.AsNoTracking()
            .Include(x => x.Items).ThenInclude(i => i.Competency)
            .FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Матрица не найдена");
        return new MatrixDto(m.Id, m.Title, m.VacancyId,
            m.Items.Select(i => new MatrixItemDto(i.CompetencyId, i.Competency.Name, i.Weight)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<MatrixDto>> Create(SaveMatrixRequest req, CancellationToken ct)
    {
        if (req.Items is null || req.Items.Count == 0)
            throw new ValidationException("Матрица должна содержать хотя бы одну компетенцию");

        var matrix = new CompetencyMatrix
        {
            Id = Guid.NewGuid(),
            Title = req.Title,
            VacancyId = req.VacancyId,
            CreatedByUserId = currentUser.Id ?? throw new ValidationException("Нет текущего пользователя"),
            Items = req.Items.Select(i => new MatrixCompetency
            {
                CompetencyId = i.CompetencyId,
                Weight = i.Weight <= 0 ? 1 : i.Weight,
            }).ToList(),
        };
        db.CompetencyMatrices.Add(matrix);
        await db.SaveChangesAsync(ct);
        return Ok(await Get(matrix.Id, ct));
    }
}
