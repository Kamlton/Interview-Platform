using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Domain.Entities;

public class GeneratedDocument
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public DocumentTemplate Template { get; set; } = null!;
    public DocumentType Type { get; set; }
    public Guid? InterviewId { get; set; }
    public Interview? Interview { get; set; }
    public Guid? CandidateId { get; set; }
    public string FileName { get; set; } = null!;
    public Guid GeneratedByUserId { get; set; }
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
}
