namespace InterviewPlatform.Api.Features.Audit;

/// <summary>
/// Событие с фронтенда: нажатие кнопки или переход по странице,
/// например "click:SaveCandidate" или "navigate:/candidates".
/// </summary>
public record LogActionRequest(string Action);
