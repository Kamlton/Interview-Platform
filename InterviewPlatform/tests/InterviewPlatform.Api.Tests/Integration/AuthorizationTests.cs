using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace InterviewPlatform.Api.Tests.Integration;

[Collection("api")]
public class AuthorizationTests(ApiFactory factory)
{
    [Fact]
    public async Task Hr_cannot_create_users()
    {
        var admin = await factory.AdminClientAsync();
        var email = $"hr_{Guid.NewGuid():N}@test";
        await admin.PostAsJsonAsync("/api/users",
            new { fullName = "HR", email, password = "Passw0rd!", role = "Отдел кадров" });

        var hrToken = await factory.CreateClient().LoginAsync(email, "Passw0rd!");
        var hr = factory.Authed(hrToken);

        var resp = await hr.PostAsJsonAsync("/api/users",
            new { fullName = "X", email = $"x_{Guid.NewGuid():N}@test", password = "Passw0rd!", role = "Отдел кадров" });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Decider_cannot_create_candidates()
    {
        var admin = await factory.AdminClientAsync();
        var email = $"dec_{Guid.NewGuid():N}@test";
        await admin.PostAsJsonAsync("/api/users",
            new { fullName = "Decider", email, password = "Passw0rd!", role = "Решала" });

        var token = await factory.CreateClient().LoginAsync(email, "Passw0rd!");
        var decider = factory.Authed(token);

        var resp = await decider.PostAsJsonAsync("/api/candidates", new { fullName = "Кандидат" });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
