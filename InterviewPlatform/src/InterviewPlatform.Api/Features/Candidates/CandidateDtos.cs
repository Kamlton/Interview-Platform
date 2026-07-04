using System.ComponentModel.DataAnnotations;
using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Features.Candidates;

public record CandidateListItem(Guid Id, string FullName, string? City, CandidateStatus Status, bool IsArchived);

public record CandidateDetails(
    Guid Id, string FullName, string? Phone, string? City, string? Education,
    string? PreviousWorkplace, CandidateStatus Status, bool IsArchived,
    IReadOnlyList<string> Skills);

public record SaveCandidateRequest(
    [RegularExpression(@"^\s*\S+\s+\S+.*$", ErrorMessage = "Пожалуйста, введите полное ФИО кандидата.")]
    string FullName,

    [RegularExpression(@"^(\+7|8)\d{10}$", ErrorMessage = "Пожалуйста, введите корректный номер телефона")]
    string? Phone,

    string? City, 
    string? Education,
    string? PreviousWorkplace, 
    List<string>? Skills
);
