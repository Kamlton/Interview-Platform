using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Domain.Entities;

public class Decision
{
    public Guid Id { get; set; }
    public Guid InterviewId { get; set; }
    public Interview Interview { get; set; } = null!;
    public DecisionType DecisionType { get; set; }
    public string? Comment { get; set; }
    public Guid MadeByUserId { get; set; }
    public User MadeBy { get; set; } = null!;
    public DateTimeOffset DecidedAt { get; set; } = DateTimeOffset.UtcNow;
}
