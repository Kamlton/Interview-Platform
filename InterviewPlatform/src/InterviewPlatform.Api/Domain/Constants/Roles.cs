namespace InterviewPlatform.Api.Domain.Constants;

public static class Roles
{
    public const string Admin = "Администратор";
    public const string Hr = "Отдел кадров";
    public const string Decider = "Решала";

    public static readonly string[] All = { Admin, Hr, Decider };
}

public static class Policies
{
    public const string AdminOnly = nameof(AdminOnly);
    public const string HrOrAdmin = nameof(HrOrAdmin);
    public const string DeciderOrAdmin = nameof(DeciderOrAdmin);
}
