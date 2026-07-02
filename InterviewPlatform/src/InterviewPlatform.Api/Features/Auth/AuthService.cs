using System.Security.Cryptography;
using System.Text;
using InterviewPlatform.Api.Auth;
using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace InterviewPlatform.Api.Features.Auth;

public record AuthTokens(string Token, DateTimeOffset ExpiresAt,
    string RefreshToken, DateTimeOffset RefreshExpiresAt, string FullName, string Role);

public class AuthService(AppDbContext db, IPasswordHasher hasher, IJwtTokenService jwt, IOptions<JwtOptions> options)
{
    private readonly int _refreshDays = options.Value.RefreshDays;

    public async Task<AuthTokens?> LoginAsync(string email, string password, CancellationToken ct)
    {
        var user = await db.Users.Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive, ct);
        if (user is null || !hasher.Verify(password, user.PasswordHash)) return null;
        return await IssueAsync(user, ct);
    }

    public async Task<AuthTokens> RefreshAsync(string rawRefresh, CancellationToken ct)
    {
        var hash = Hash(rawRefresh);
        var token = await db.RefreshTokens.Include(r => r.User).ThenInclude(u => u.Role)
            .FirstOrDefaultAsync(r => r.TokenHash == hash, ct);
        if (token is null || !token.IsActive)
            throw new UnauthorizedException("Недействительный или истёкший refresh-токен");

        token.RevokedAt = DateTimeOffset.UtcNow;     // ротация
        return await IssueAsync(token.User, ct);
    }

    public async Task LogoutAsync(string rawRefresh, CancellationToken ct)
    {
        var hash = Hash(rawRefresh);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash, ct);
        if (token is { RevokedAt: null })
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task ChangePasswordAsync(Guid userId, string current, string next, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("Пользователь не найден");
        if (!hasher.Verify(current, user.PasswordHash))
            throw new ValidationException("Текущий пароль неверен");
        if (string.IsNullOrWhiteSpace(next) || next.Length < 6)
            throw new ValidationException("Новый пароль слишком короткий (минимум 6 символов)");

        user.PasswordHash = hasher.Hash(next);
        await db.SaveChangesAsync(ct);
        await db.RefreshTokens.Where(r => r.UserId == userId && r.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.RevokedAt, DateTimeOffset.UtcNow), ct);
    }

    private async Task<AuthTokens> IssueAsync(User user, CancellationToken ct)
    {
        var (access, accessExp) = jwt.CreateToken(user);
        var raw = Base64Url(RandomNumberGenerator.GetBytes(32));
        var refreshExp = DateTimeOffset.UtcNow.AddDays(_refreshDays);

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(), UserId = user.Id, TokenHash = Hash(raw), ExpiresAt = refreshExp,
        });
        await db.SaveChangesAsync(ct);
        return new AuthTokens(access, accessExp, raw, refreshExp, user.FullName, user.Role.Name);
    }

    private static string Hash(string raw) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
}
