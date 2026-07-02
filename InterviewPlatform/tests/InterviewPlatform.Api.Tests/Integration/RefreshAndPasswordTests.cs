using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace InterviewPlatform.Api.Tests.Integration;

[Collection("api")]
public class RefreshAndPasswordTests(ApiFactory factory)
{
    [Fact]
    public async Task Refresh_issues_new_tokens_and_rotates_old()
    {
        var client = factory.CreateClient();
        var login = await (await client.PostAsJsonAsync("/api/auth/login",
            new { email = TestHelpers.AdminEmail, password = TestHelpers.AdminPassword }))
            .Content.ReadFromJsonAsync<LoginResp>();
        login!.RefreshToken.Should().NotBeNullOrWhiteSpace();

        var refreshed = await client.PostAsJsonAsync("/api/auth/refresh",
            new { refreshToken = login.RefreshToken });
        refreshed.StatusCode.Should().Be(HttpStatusCode.OK);
        var newTokens = await refreshed.Content.ReadFromJsonAsync<LoginResp>();
        newTokens!.Token.Should().NotBeNullOrWhiteSpace();

        var reuse = await client.PostAsJsonAsync("/api/auth/refresh",
            new { refreshToken = login.RefreshToken });
        reuse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Change_password_updates_credentials()
    {
        var admin = await factory.AdminClientAsync();
        var email = $"chpwd_{Guid.NewGuid():N}@test";
        await admin.PostAsJsonAsync("/api/users",
            new { fullName = "User", email, password = "OldPass1", role = "Отдел кадров" });

        var token = await factory.CreateClient().LoginAsync(email, "OldPass1");
        var authed = factory.Authed(token);

        var change = await authed.PostAsJsonAsync("/api/auth/change-password",
            new { currentPassword = "OldPass1", newPassword = "NewPass2" });
        change.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var oldLogin = await factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { email, password = "OldPass1" });
        oldLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var newLogin = await factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { email, password = "NewPass2" });
        newLogin.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
