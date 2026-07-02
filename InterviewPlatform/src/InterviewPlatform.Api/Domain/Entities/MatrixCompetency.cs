namespace InterviewPlatform.Api.Domain.Entities;

public class MatrixCompetency
{
    public Guid MatrixId { get; set; }
    public CompetencyMatrix Matrix { get; set; } = null!;
    public Guid CompetencyId { get; set; }
    public Competency Competency { get; set; } = null!;
    public int Weight { get; set; } = 1;
}
