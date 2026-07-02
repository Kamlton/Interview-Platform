using System.Text.Json;
using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;

namespace InterviewPlatform.Api.Infrastructure;

public class AuditService(AppDbContext db, ICurrentUser currentUser) : IAuditService
{
    public async Task LogAsync(string entityType, Guid entityId, string action,
        object? details = null, CancellationToken ct = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            ChangedByUserId = currentUser.Id,
            ChangedAt = DateTimeOffset.UtcNow,
            Details = details is null ? null : JsonSerializer.Serialize(details),
        });
        await db.SaveChangesAsync(ct);
    }
}
