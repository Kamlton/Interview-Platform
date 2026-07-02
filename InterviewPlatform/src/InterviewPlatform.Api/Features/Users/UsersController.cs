using InterviewPlatform.Api.Auth;
using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Users;

[ApiController]
[Route("api/users")]
[Authorize(Policy = Policies.AdminOnly)] 
public class UsersController(AppDbContext db, IPasswordHasher hasher) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> List(CancellationToken ct) =>
        Ok(await db.Users.Include(u => u.Role)
            .Select(u => new UserDto(u.Id, u.FullName, u.Email, u.Role.Name, u.IsActive))
            .ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest req, CancellationToken ct)
    {
        if (!Roles.All.Contains(req.Role))
            throw new ValidationException($"Недопустимая роль: {req.Role}");
        if (await db.Users.AnyAsync(u => u.Email == req.Email, ct))
            throw new ConflictException("Пользователь с таким e-mail уже существует");

        var role = await db.Roles.FirstAsync(r => r.Name == req.Role, ct);
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = req.FullName,
            Email = req.Email,
            PasswordHash = hasher.Hash(req.Password),
            RoleId = role.Id,
            IsActive = true,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(List), new UserDto(user.Id, user.FullName, user.Email, role.Name, true));
    }
}
