using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Features.PrintForms;

public record GeneratedFile(string FileName, byte[] Content, string ContentType = "application/pdf");

public interface IPrintFormService
{
    Task<GeneratedFile> GenerateAsync(Guid interviewId, DocumentType type, CancellationToken ct);
}
