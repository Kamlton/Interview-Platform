namespace InterviewPlatform.Api.Common;

public interface IAuditService
{
    Task LogAsync(string entityType, Guid entityId, string action, object? details = null, CancellationToken ct = default);
}
