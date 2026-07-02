namespace InterviewPlatform.Api.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "InterviewPlatform";
    public string Audience { get; set; } = "InterviewPlatform";
    public string Key { get; set; } = null!;       // >= 32 символов
    public int ExpiresMinutes { get; set; } = 120;
    public int RefreshDays { get; set; } = 7;
}
