using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace InterviewPlatform.Api.Tests;

public record LoginResp(string Token, string RefreshToken, string FullName, string Role);
public record UserResp(Guid Id, string FullName, string Role);
public record VacancyResp(Guid Id, string Title);
public record CompetencyResp(Guid Id, string Name);
public record CandidateResp(Guid Id, string FullName, string Status);
public record InterviewResp(Guid Id);
public record ScoreLineResp(Guid CompetencyId, int Score);
public record ProtocolResp(Guid InterviewId, double AverageScore, string Status, ScoreLineResp[] Scores, string? Decision);
public record PagedResp<T>(T[] Items, int Total);

public static class TestHelpers
{
    public const string AdminEmail = "admin@local";
    public const string AdminPassword = "Admin#12345";

    public static async Task<string> LoginAsync(this HttpClient client, string email, string password)
    {
        var resp = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<LoginResp>();
        return body!.Token;
    }

    public static HttpClient Authed(this ApiFactory factory, string token)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public static async Task<HttpClient> AdminClientAsync(this ApiFactory factory)
    {
        var anon = factory.CreateClient();
        var token = await anon.LoginAsync(AdminEmail, AdminPassword);
        return factory.Authed(token);
    }

    public static async Task<T> ReadAsync<T>(this HttpResponseMessage resp)
    {
        resp.EnsureSuccessStatusCode();
        return (await resp.Content.ReadFromJsonAsync<T>())!;
    }

    public static async Task<T> ReadAsync<T>(this Task<HttpResponseMessage> respTask)
    {
        var resp = await respTask;
        resp.EnsureSuccessStatusCode();
        return (await resp.Content.ReadFromJsonAsync<T>())!;
    }
}
