using InterviewPlatform.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.PrintForms;

[ApiController]
[Route("api/interviews/{interviewId:guid}/print")]
[Authorize]
public class PrintFormsController(IPrintFormService service) : ControllerBase
{
    [HttpGet("{type}")]
    public async Task<IActionResult> Generate(Guid interviewId, DocumentType type, CancellationToken ct)
    {
        var file = await service.GenerateAsync(interviewId, type, ct);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
