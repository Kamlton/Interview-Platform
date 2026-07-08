using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.Archive;

[ApiController]
[Route("api/archive")]
public class ArchiveController(ArchiveService svc) : ControllerBase
{
    //весь архив с сортировкой и поиском
    [HttpGet]
    [Authorize(Policy = Policies.HrOrAdmin)]
    public Task<PagedResult<ArchiveItemDto>> List(
        [FromQuery] string? type, [FromQuery] string? search,
        [FromQuery] string sort = "date", [FromQuery] string dir = "desc",
        [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
        => svc.ListAsync(type, search, sort, dir, page, size, ct);

    // возврат из архива
    [HttpPost("{type}/{id:guid}/restore")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Restore(string type, Guid id, CancellationToken ct)
    {
        await svc.RestoreAsync(type, id, ct);
        return NoContent();
    }

    // удаление из архива
    [HttpDelete("{type}/{id:guid}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Delete(string type, Guid id, CancellationToken ct)
    {
        await svc.DeleteAsync(type, id, ct);
        return NoContent();
    }
}
