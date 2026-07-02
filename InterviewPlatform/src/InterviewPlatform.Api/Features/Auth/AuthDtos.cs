namespace InterviewPlatform.Api.Features.Auth;

public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record AuthResponse(
    string Token, DateTimeOffset ExpiresAt,
    string RefreshToken, DateTimeOffset RefreshExpiresAt,
    string FullName, string Role);
