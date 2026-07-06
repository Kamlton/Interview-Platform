using InterviewPlatform.Api.Auth;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Infrastructure;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher, IConfiguration config)
    {
        await db.Database.MigrateAsync();

        if (!await db.Roles.AnyAsync())
        {
            var roles = Roles.All.Select(n => new Role { Id = Guid.NewGuid(), Name = n }).ToList();
            db.Roles.AddRange(roles);
            await db.SaveChangesAsync();
        }

        if (!await db.Users.AnyAsync())
        {
            var adminRole = await db.Roles.FirstAsync(r => r.Name == Roles.Admin);
            var email = config["Seed:AdminEmail"] ?? "admin@local";
            var pwd = config["Seed:AdminPassword"] ?? "Admin#12345";
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                FullName = "Администратор системы",
                Email = email,
                PasswordHash = hasher.Hash(pwd),
                RoleId = adminRole.Id,
                IsActive = true,
            });
            await db.SaveChangesAsync();
        }

        if (!await db.DocumentTemplates.AnyAsync())
        {
            db.DocumentTemplates.AddRange(
                new DocumentTemplate { Id = Guid.NewGuid(), Type = DocumentType.OfferLetter,
                    Name = "Оффер (по умолчанию)", HtmlBody = Features.PrintForms.DefaultTemplates.Offer },
                new DocumentTemplate { Id = Guid.NewGuid(), Type = DocumentType.RejectionLetter,
                    Name = "Отказ (по умолчанию)", HtmlBody = Features.PrintForms.DefaultTemplates.Rejection },
                new DocumentTemplate { Id = Guid.NewGuid(), Type = DocumentType.InterviewProtocol,
                    Name = "Протокол собеседования (по умолчанию)", HtmlBody = Features.PrintForms.DefaultTemplates.Protocol });
            await db.SaveChangesAsync();
        }
    }
}
