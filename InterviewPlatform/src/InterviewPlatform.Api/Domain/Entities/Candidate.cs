using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Domain.Entities;

public class Candidate
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = null!;
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? Education { get; set; }
    public string? PreviousWorkplace { get; set; }
    public CandidateStatus Status { get; set; } = CandidateStatus.New;
    public bool IsArchived { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CandidateSkill> CandidateSkills { get; set; } = new List<CandidateSkill>();
    public ICollection<Interview> Interviews { get; set; } = new List<Interview>();
}
