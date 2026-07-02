using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Features.Interviews;

public record CreateInterviewRequest(
    Guid CandidateId, Guid VacancyId, Guid InterviewerUserId,
    Guid? MatrixId, string? Plan, DateTimeOffset ScheduledAt);

public record InterviewListItem(
    Guid Id, string CandidateName, string VacancyTitle, string InterviewerName,
    DateTimeOffset ScheduledAt, InterviewStatus Status);

public record InterviewDetails(
    Guid Id, Guid CandidateId, string CandidateName, Guid VacancyId, string VacancyTitle,
    string InterviewerName, Guid? MatrixId, string? Plan, DateTimeOffset ScheduledAt,
    InterviewStatus Status, string? Summary, bool IsArchived);
