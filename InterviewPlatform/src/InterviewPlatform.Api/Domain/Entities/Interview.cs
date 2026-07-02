using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Domain.Entities;

public class Interview
{
    public Guid Id { get; set; }

    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public Guid VacancyId { get; set; }
    public Vacancy Vacancy { get; set; } = null!;

    public Guid InterviewerUserId { get; set; }
    public User Interviewer { get; set; } = null!;

    public Guid? MatrixId { get; set; }
    public CompetencyMatrix? Matrix { get; set; }

    public string? Plan { get; set; }
    public DateTimeOffset ScheduledAt { get; set; }
    public InterviewStatus Status { get; set; } = InterviewStatus.Planned;
    public string? Summary { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CompetencyScore> Scores { get; set; } = new List<CompetencyScore>();
    public Decision? Decision { get; set; }
    public ICollection<GeneratedDocument> GeneratedDocuments { get; set; } = new List<GeneratedDocument>();
}
