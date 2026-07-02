namespace InterviewPlatform.Api.Domain.Entities;

public class Competency
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Category { get; set; }
    public string? Description { get; set; }

    public ICollection<MatrixCompetency> MatrixCompetencies { get; set; } = new List<MatrixCompetency>();
    public ICollection<CompetencyScore> Scores { get; set; } = new List<CompetencyScore>();
}
