using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace InterviewPlatform.Api.Tests.Integration;

[Collection("api")]
public class WorkflowTests(ApiFactory factory)
{
    [Fact]
    public async Task Full_hiring_flow_from_candidate_to_offer()
    {
        var admin = await factory.AdminClientAsync();

        var hrEmail = $"hr_{Guid.NewGuid():N}@test";
        var hr = await admin.PostAsJsonAsync("/api/users",
            new { fullName = "HR", email = hrEmail, password = "Passw0rd!", role = "Отдел кадров" })
            .ReadAsync<UserResp>();
        var decEmail = $"dec_{Guid.NewGuid():N}@test";
        await admin.PostAsJsonAsync("/api/users",
            new { fullName = "Decider", email = decEmail, password = "Passw0rd!", role = "Решала" });

        var hrClient = factory.Authed(await factory.CreateClient().LoginAsync(hrEmail, "Passw0rd!"));
        var decClient = factory.Authed(await factory.CreateClient().LoginAsync(decEmail, "Passw0rd!"));

        var vacancy = await hrClient.PostAsJsonAsync("/api/vacancies",
            new { title = $"Backend {Guid.NewGuid():N}" }).ReadAsync<VacancyResp>();
        var comps = await hrClient.GetAsync("/api/competencies").ReadAsync<CompetencyResp[]>();
        comps.Length.Should().BeGreaterThanOrEqualTo(2);

        var candName = $"Иванов {Guid.NewGuid():N}";
        var candidate = await hrClient.PostAsJsonAsync("/api/candidates",
            new { fullName = candName, city = "Москва", skills = new[] { "C#", "SQL" } })
            .ReadAsync<CandidateResp>();
        candidate.Status.Should().Be("New");

        var registry = await hrClient.GetAsync($"/api/candidates?search={Uri.EscapeDataString(candName)}")
            .ReadAsync<PagedResp<CandidateResp>>();
        registry.Items.Should().ContainSingle(c => c.Id == candidate.Id);

        var interview = await hrClient.PostAsJsonAsync("/api/interviews", new
        {
            candidateId = candidate.Id,
            vacancyId = vacancy.Id,
            interviewerUserId = hr.Id,
            scheduledAt = DateTimeOffset.UtcNow.AddDays(1),
            plan = "Алгоритмы + система",
        }).ReadAsync<InterviewResp>();

        var scores = new[]
        {
            new { competencyId = comps[0].Id, score = 4, comment = "ок" },
            new { competencyId = comps[1].Id, score = 5, comment = "сильно" },
        };
        var save = await hrClient.PutAsJsonAsync($"/api/interviews/{interview.Id}/scores",
            new { scores, summary = "Рекомендован" });
        save.EnsureSuccessStatusCode();

        var protocol = await hrClient.GetAsync($"/api/interviews/{interview.Id}/protocol")
            .ReadAsync<ProtocolResp>();
        protocol.AverageScore.Should().Be(4.5);
        protocol.Scores.Should().HaveCount(2);
        protocol.Status.Should().Be("Completed");

        var decide = await decClient.PostAsJsonAsync($"/api/interviews/{interview.Id}/decision",
            new { decisionType = "Offer" });
        decide.EnsureSuccessStatusCode();

        var afterDecision = await hrClient.GetAsync($"/api/candidates/{candidate.Id}")
            .ReadAsync<CandidateResp>();
        afterDecision.Status.Should().Be("Hired");
    }
}
