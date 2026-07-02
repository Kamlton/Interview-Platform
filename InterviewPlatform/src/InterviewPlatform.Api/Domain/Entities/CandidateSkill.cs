namespace InterviewPlatform.Api.Domain.Entities;

public class CandidateSkill
{
    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;
    public Guid SkillId { get; set; }
    public Skill Skill { get; set; } = null!;
}
