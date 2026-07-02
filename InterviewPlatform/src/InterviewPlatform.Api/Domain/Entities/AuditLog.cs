namespace InterviewPlatform.Api.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = null!;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = null!;
    public Guid? ChangedByUserId { get; set; }
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? Details { get; set; }           
}
