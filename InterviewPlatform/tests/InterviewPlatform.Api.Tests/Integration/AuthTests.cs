using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace InterviewPlatform.Api.Tests.Integration;

[Collection("api")]
public class AuthTests(ApiFactory factory)
{
    [Fact]
    public async Task Login_with_valid_admin_returns_token()
    {
        var client = factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/auth/login",
            new { email = TestHelpers.AdminEmail, password = TestHelpers.AdminPassword });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<LoginResp>();
        body!.Token.Should().NotBeNullOrWhiteSpace();
        body.Role.Should().Be("Администратор");
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_401()
    {
        var client = factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/auth/login",
            new { email = TestHelpers.AdminEmail, password = "nope" });
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Protected_endpoint_without_token_returns_401()
    {
        var client = factory.CreateClient();
        var resp = await client.GetAsync("/api/candidates");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
