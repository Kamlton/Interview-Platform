using InterviewPlatform.Api.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.Assessment;

[ApiController]
[Route("api/interviews/{interviewId:guid}")]
[Authorize]
public class AssessmentController(AssessmentService service) : ControllerBase
{
    [HttpPut("scores")]
    [Authorize(Policy = Policies.HrOrAdmin)]
    public async Task<IActionResult> SaveScores(Guid interviewId, SaveScoresRequest req, CancellationToken ct)
    {
        await service.SaveScoresAsync(interviewId, req, ct);
        return NoContent();
    }

    [HttpGet("protocol")]
    public Task<ProtocolDto> Protocol(Guid interviewId, CancellationToken ct)
        => service.GetProtocolAsync(interviewId, ct);
}
