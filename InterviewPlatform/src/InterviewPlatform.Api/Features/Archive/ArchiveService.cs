using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Archive;

public record ArchiveItemDto(Guid Id, string Type, string TypeLabel, string Title,
    string? Subtitle, DateTimeOffset CreatedAt);
public class ArchiveService(AppDbContext db, IAuditService audit)
{
    public async Task<PagedResult<ArchiveItemDto>> ListAsync(
        string? type, string? search, string sort, string dir, int page, int size, CancellationToken ct)
    {
        var all = string.IsNullOrWhiteSpace(type) || type == "All";
        var items = new List<ArchiveItemDto>();

        if (all || type == "Candidate")
            items.AddRange(await db.Candidates.AsNoTracking().Where(c => c.IsArchived)
                .Select(c => new ArchiveItemDto(c.Id, "Candidate", "Кандидат", c.FullName, c.City, c.CreatedAt))
                .ToListAsync(ct));

        if (all || type == "Vacancy")
            items.AddRange(await db.Vacancies.AsNoTracking().Where(v => v.IsArchived)
                .Select(v => new ArchiveItemDto(v.Id, "Vacancy", "Вакансия", v.Title, v.Status, v.CreatedAt))
                .ToListAsync(ct));

        if (all || type == "Interview")
            items.AddRange(await db.Interviews.AsNoTracking().Where(i => i.IsArchived)
                .Select(i => new ArchiveItemDto(i.Id, "Interview", "Собеседование",
                    i.Candidate.FullName + " — " + i.Vacancy.Title, i.Status.ToString(), i.CreatedAt))
                .ToListAsync(ct));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            items = items.Where(x =>
                x.Title.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                (x.Subtitle != null && x.Subtitle.Contains(s, StringComparison.OrdinalIgnoreCase))).ToList();
        }

        Func<ArchiveItemDto, object> key = sort switch
        {
            "title" => x => x.Title,
            "type" => x => x.TypeLabel,
            _ => x => x.CreatedAt,
        };
        items = (string.Equals(dir, "asc", StringComparison.OrdinalIgnoreCase)
            ? items.OrderBy(key) : items.OrderByDescending(key)).ToList();

        var total = items.Count;
        var pageItems = items.Skip((Math.Max(page, 1) - 1) * size).Take(size).ToList();
        return new PagedResult<ArchiveItemDto>(pageItems, total, page, size);
    }

    public async Task RestoreAsync(string type, Guid id, CancellationToken ct)
    {
        switch (type)
        {
            case "Candidate": (await Find<Candidate>(id, ct)).IsArchived = false; break;
            case "Vacancy": (await Find<Vacancy>(id, ct)).IsArchived = false; break;
            case "Interview": (await Find<Interview>(id, ct)).IsArchived = false; break;
            default: throw new ValidationException("Неизвестный тип сущности");
        }
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(type, id, "Restore", null, ct);
    }

    public async Task DeleteAsync(string type, Guid id, CancellationToken ct)
    {
        switch (type)
        {
            case "Candidate": db.Candidates.Remove(await Find<Candidate>(id, ct)); break;
            case "Vacancy":
                if (await db.Interviews.AnyAsync(i => i.VacancyId == id, ct))
                    throw new ConflictException("Нельзя удалить вакансию: по ней есть собеседования");
                db.Vacancies.Remove(await Find<Vacancy>(id, ct));
                break;
            case "Interview": db.Interviews.Remove(await Find<Interview>(id, ct)); break;
            default: throw new ValidationException("Неизвестный тип сущности");
        }
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(type, id, "Delete", null, ct);
    }

    private async Task<T> Find<T>(Guid id, CancellationToken ct) where T : class =>
        await db.Set<T>().FindAsync([id], ct) ?? throw new NotFoundException("Запись не найдена");
}
