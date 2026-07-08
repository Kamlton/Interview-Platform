using System.Text.Json.Serialization;

namespace InterviewPlatform.Api.Features.Audit;

/// <summary>
/// Одна запись в журнале аудита: кто, с какой ролью, когда и какое действие выполнил.
/// </summary>
public class AuditLogEntry
{
    [JsonPropertyName("username")]
    public string Username { get; init; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; init; } = string.Empty;

    [JsonPropertyName("time")]
    public DateTime Timestamp { get; init; }

    [JsonPropertyName("action")]
    public string Action { get; init; } = string.Empty;

    /// <summary>Маршрут раздела во фронтенде, к которому относится действие (например "/vacancies").</summary>
    [JsonPropertyName("link")]
    public string? Link { get; init; }
}
