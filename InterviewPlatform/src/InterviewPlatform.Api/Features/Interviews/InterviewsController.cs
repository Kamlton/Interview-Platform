using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.Interviews;

[ApiController]
[Route("api/interviews")]
[Authorize]
public class InterviewsController(InterviewService service) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<InterviewListItem>> Registry(
        [FromQuery] PageQuery query, [FromQuery] Guid? candidateId = null,
        [FromQuery] Guid? vacancyId = null, CancellationToken ct = default)
        => service.GetRegistryAsync(query, candidateId, vacancyId, ct);

    [HttpGet("{id:guid}")]
    public Task<InterviewDetails> Get(Guid id, CancellationToken ct) => service.GetAsync(id, ct);

    [HttpPost]
    [Authorize(Policy = Policies.HrOrAdmin)]
    public async Task<ActionResult<InterviewDetails>> Create(CreateInterviewRequest req, CancellationToken ct)
    {
        var created = await service.CreateAsync(req, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }
}
