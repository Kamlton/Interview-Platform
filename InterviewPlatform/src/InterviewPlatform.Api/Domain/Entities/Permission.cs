namespace InterviewPlatform.Api.Domain.Entities;

public class Permission
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
