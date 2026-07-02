using System.Security.Claims;

namespace InterviewPlatform.Api.Common;

public interface ICurrentUser
{
    Guid? Id { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;
    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;
    public Guid? Id => Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    public string? Role => Principal?.FindFirstValue(ClaimTypes.Role);
}
