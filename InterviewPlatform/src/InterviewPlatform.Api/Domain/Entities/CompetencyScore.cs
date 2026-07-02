namespace InterviewPlatform.Api.Domain.Entities;

public class CompetencyScore
{
    public Guid Id { get; set; }
    public Guid InterviewId { get; set; }
    public Interview Interview { get; set; } = null!;
    public Guid CompetencyId { get; set; }
    public Competency Competency { get; set; } = null!;
    public int Score { get; set; }          // 1..5
    public string? Comment { get; set; }
}
