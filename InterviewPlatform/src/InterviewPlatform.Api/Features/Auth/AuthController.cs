using InterviewPlatform.Api.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Features.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth, ICurrentUser currentUser) : ControllerBase
{
    private static AuthResponse Map(AuthTokens t) =>
        new(t.Token, t.ExpiresAt, t.RefreshToken, t.RefreshExpiresAt, t.FullName, t.Role);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req, CancellationToken ct)
    {
        var tokens = await auth.LoginAsync(req.Email, req.Password, ct);
        return tokens is null
            ? Unauthorized(new { message = "Неверный e-mail или пароль" })
            : Ok(Map(tokens));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest req, CancellationToken ct)
        => Ok(Map(await auth.RefreshAsync(req.RefreshToken, ct)));

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(RefreshRequest req, CancellationToken ct)
    {
        await auth.LogoutAsync(req.RefreshToken, ct);
        return NoContent();
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req, CancellationToken ct)
    {
        var userId = currentUser.Id ?? throw new UnauthorizedException("Нет текущего пользователя");
        await auth.ChangePasswordAsync(userId, req.CurrentPassword, req.NewPassword, ct);
        return NoContent();
    }
}
