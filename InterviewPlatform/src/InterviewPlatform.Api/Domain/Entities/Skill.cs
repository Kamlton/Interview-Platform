namespace InterviewPlatform.Api.Domain.Entities;

public class Skill
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<CandidateSkill> CandidateSkills { get; set; } = new List<CandidateSkill>();
}
