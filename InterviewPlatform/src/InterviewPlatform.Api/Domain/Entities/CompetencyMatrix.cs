namespace InterviewPlatform.Api.Domain.Entities;

public class CompetencyMatrix
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;

    public Guid? VacancyId { get; set; }
    public Vacancy? Vacancy { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<MatrixCompetency> Items { get; set; } = new List<MatrixCompetency>();
    public ICollection<Interview> Interviews { get; set; } = new List<Interview>();
}
