namespace InterviewPlatform.Api.Domain.Entities;

public class Vacancy
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = "Open";
    public bool IsArchived { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Interview> Interviews { get; set; } = new List<Interview>();
    public ICollection<CompetencyMatrix> Matrices { get; set; } = new List<CompetencyMatrix>();
}
