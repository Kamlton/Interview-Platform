using InterviewPlatform.Api.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.Audit;

/// <summary>
/// Чтение журнала аудита. Сами записи создаёт сервер в момент бизнес-операций
/// (см. <see cref="IUserActionAuditService.LogCurrentUserAsync"/>), поэтому
/// эндпоинтов записи с фронтенда здесь нет — журнал полностью серверный.
/// Просмотр — только администратору.
/// </summary>
[ApiController]
[Route("api/audit")]
[Authorize(Policy = Policies.AdminOnly)]
public class AuditController(IUserActionAuditService audit) : ControllerBase
{
    // Журнал одного пользователя.
    [HttpGet("users/{username}/actions")]
    public async Task<ActionResult<IReadOnlyList<AuditLogEntry>>> GetUserHistory(string username) =>
        Ok(await audit.GetUserHistoryAsync(username));

    // Сводный журнал по всем пользователям.
    [HttpGet("actions")]
    public async Task<ActionResult<IReadOnlyList<AuditLogEntry>>> GetAllHistory() =>
        Ok(await audit.GetAllHistoryAsync());
}
