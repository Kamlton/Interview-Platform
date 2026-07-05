using System.Security.Claims;
using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.Audit;

/// <summary>
/// Принимает события действий пользователя с фронтенда (нажатия кнопок,
/// переходы по страницам). Имя, роль и время не доверяются клиенту —
/// берутся из JWT-клеймов и часов сервера.
/// </summary>
[ApiController]
[Route("api/audit")]
[Authorize]
public class AuditController(IUserActionAuditService audit) : ControllerBase
{
    [HttpPost("actions")]
    public async Task<IActionResult> LogAction(LogActionRequest req)
    {
        // Email уникален и используется как логин, поэтому он же — имя json-файла.
        var username = User.FindFirstValue(ClaimTypes.Email)
            ?? throw new UnauthorizedException("В токене отсутствует e-mail пользователя.");
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "unknown";

        await audit.LogActionAsync(username, role, req.Action);
        return NoContent();
    }

    [HttpGet("users/{username}/actions")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<ActionResult<IReadOnlyList<AuditLogEntry>>> GetUserHistory(string username) =>
        Ok(await audit.GetUserHistoryAsync(username));
}
