using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Features.Assessment;

public record ScoreInput(Guid CompetencyId, int Score, string? Comment);
public record SaveScoresRequest(List<ScoreInput> Scores, string? Summary);

public record ScoreLine(Guid CompetencyId, string CompetencyName, int Score, string? Comment);
public record ProtocolDto(
    Guid InterviewId, 
    string CandidateName, 
    string VacancyTitle, 
    DateTimeOffset ScheduledAt,
    InterviewStatus Status, 
    string? Summary, 
    double AverageScore,
    IReadOnlyList<ScoreLine> Scores, 
    string? Decision
);