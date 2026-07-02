using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Domain.Entities;

public class DocumentTemplate
{
    public Guid Id { get; set; }
    public DocumentType Type { get; set; }
    public string Name { get; set; } = null!;
    public string HtmlBody { get; set; } = null!;

    public ICollection<GeneratedDocument> GeneratedDocuments { get; set; } = new List<GeneratedDocument>();
}
