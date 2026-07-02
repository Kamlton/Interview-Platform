using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using InterviewPlatform.Api.Auth;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using Microsoft.Extensions.Options;
using Xunit;

namespace InterviewPlatform.Api.Tests.Unit;

public class JwtTokenServiceTests
{
    [Fact]
    public void Token_contains_role_and_user_id()
    {
        var opts = Options.Create(new JwtOptions { Key = "unit_test_key_at_least_32_chars_0123456789" });
        var svc = new JwtTokenService(opts);
        var user = new User
        {
            Id = Guid.NewGuid(), FullName = "Тест", Email = "t@t",
            Role = new Role { Name = Roles.Hr },
        };

        var (token, expires) = svc.CreateToken(user);
        expires.Should().BeAfter(DateTimeOffset.UtcNow);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == Roles.Hr);
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == user.Id.ToString());
    }
}
