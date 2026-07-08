using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Domain.Enums;
using InterviewPlatform.Api.Features.Audit;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.Decisions;

public record MakeDecisionRequest(DecisionType DecisionType, string? Comment);
public record DecisionDto(Guid Id, Guid InterviewId, DecisionType DecisionType, string? Comment, DateTimeOffset DecidedAt);

[ApiController]
[Route("api/interviews/{interviewId:guid}/decision")]
[Authorize(Policy = Policies.DeciderOrAdmin)]
public class DecisionsController(AppDbContext db, ICurrentUser currentUser, IAuditService audit,
    IUserActionAuditService userAudit) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<DecisionDto>> Make(Guid interviewId, MakeDecisionRequest req, CancellationToken ct)
    {
        var interview = await db.Interviews.Include(i => i.Decision).Include(i => i.Candidate)
            .FirstOrDefaultAsync(i => i.Id == interviewId, ct)
            ?? throw new NotFoundException("Собеседование не найдено");
        if (interview.Decision is not null)
            throw new ConflictException("Решение по этому собеседованию уже принято");

        var decision = new Decision
        {
            Id = Guid.NewGuid(),
            InterviewId = interviewId,
            DecisionType = req.DecisionType,
            Comment = req.Comment,
            MadeByUserId = currentUser.Id ?? throw new ValidationException("Нет текущего пользователя"),
        };
        db.Decisions.Add(decision);

        interview.Candidate.Status = req.DecisionType switch
        {
            DecisionType.Offer => CandidateStatus.Hired,
            DecisionType.Reject => CandidateStatus.Rejected,
            _ => interview.Candidate.Status,
        };

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(nameof(Candidate), interview.CandidateId, "Decision",
            new { req.DecisionType, interviewId }, ct);

        var decisionRu = req.DecisionType switch
        {
            DecisionType.Offer => "Оффер",
            DecisionType.Reject => "Отказ",
            _ => "Пауза",
        };
        await userAudit.LogCurrentUserAsync(
            $"Принято решение «{decisionRu}» по кандидату {interview.Candidate.FullName}",
            $"/interviews/{interviewId}");

        return Ok(new DecisionDto(decision.Id, interviewId, decision.DecisionType, decision.Comment, decision.DecidedAt));
    }
}
