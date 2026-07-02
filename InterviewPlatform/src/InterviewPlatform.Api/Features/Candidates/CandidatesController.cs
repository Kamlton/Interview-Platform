using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.Candidates;

[ApiController]
[Route("api/candidates")]
[Authorize(Policy = Policies.HrOrAdmin)]
public class CandidatesController(CandidateService service) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<CandidateListItem>> Registry(
        [FromQuery] PageQuery query, [FromQuery] bool includeArchived = false, CancellationToken ct = default)
        => service.GetRegistryAsync(query, includeArchived, ct);

    [HttpGet("{id:guid}")]
    public Task<CandidateDetails> Get(Guid id, CancellationToken ct) => service.GetAsync(id, ct);

    [HttpPost]
    public async Task<ActionResult<CandidateDetails>> Create(SaveCandidateRequest req, CancellationToken ct)
    {
        var created = await service.CreateAsync(req, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public Task<CandidateDetails> Update(Guid id, SaveCandidateRequest req, CancellationToken ct)
        => service.UpdateAsync(id, req, ct);

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, [FromQuery] bool archived = true, CancellationToken ct = default)
    {
        await service.ArchiveAsync(id, archived, ct);
        return NoContent();
    }
}
