using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Domain.Enums;
using InterviewPlatform.Api.Features.Audit;
using InterviewPlatform.Api.Infrastructure;

namespace InterviewPlatform.Api.Features.Assessment;

public class AssessmentService(AppDbContext db, IAuditService audit, IUserActionAuditService userAudit)
{
    public async Task SaveScoresAsync(Guid interviewId, SaveScoresRequest req, CancellationToken ct)
    {
        // 1. Загружаем собеседование с существующими оценками
        var interview = await db.Interviews
            .Include(i => i.Scores)
            .Include(i => i.Candidate)
            .FirstOrDefaultAsync(i => i.Id == interviewId, ct)
            ?? throw new NotFoundException("Собеседование не найдено");

        // 2. Валидация: проверяем, что все оценки в диапазоне 1..10
        foreach (var s in req.Scores)
        {
            if (s.Score is < 1 or > 10)
                throw new ValidationException("Оценка должна быть в диапазоне 1..10");
        }

        // 3. УДАЛЯЕМ все старые оценки (если они есть)
        if (interview.Scores.Any())
        {
            db.CompetencyScores.RemoveRange(interview.Scores);
        }

        // 4. СОЗДАЁМ новые оценки из запроса
        var newScores = req.Scores.Select(s => new CompetencyScore
        {
            Id = Guid.NewGuid(),
            InterviewId = interviewId,
            CompetencyId = s.CompetencyId,
            Score = s.Score,
            Comment = s.Comment
        }).ToList();

        // 5. Добавляем новые оценки
        if (newScores.Any())
        {
            await db.CompetencyScores.AddRangeAsync(newScores, ct);
        }

        // 6. Обновляем Summary и статус
        if (req.Summary is not null) 
            interview.Summary = req.Summary;
        
        if (interview.Status == InterviewStatus.Planned) 
            interview.Status = InterviewStatus.Completed;

        // 7. Сохраняем всё одной транзакцией
        await db.SaveChangesAsync(ct);
        
        // 8. Логируем
        await audit.LogAsync(nameof(Candidate), interview.CandidateId, "ScoresSaved", new { interviewId }, ct);
        await userAudit.LogCurrentUserAsync(
            $"Выставлены оценки по собеседованию кандидата {interview.Candidate.FullName}",
            $"/interviews/{interviewId}");
    }

    public async Task<ProtocolDto> GetProtocolAsync(Guid interviewId, CancellationToken ct)
    {
        var i = await db.Interviews
            .AsNoTracking()
            .Include(x => x.Candidate)
            .Include(x => x.Vacancy)
            .Include(x => x.Scores)
                .ThenInclude(s => s.Competency)
            .Include(x => x.Decision)
            .FirstOrDefaultAsync(x => x.Id == interviewId, ct)
            ?? throw new NotFoundException("Собеседование не найдено");

        var lines = i.Scores
            .Select(s => new ScoreLine(s.CompetencyId, s.Competency.Name, s.Score, s.Comment))
            .OrderBy(l => l.CompetencyName)
            .ToList();
        
        var avg = lines.Count > 0 
            ? Math.Round(lines.Average(l => l.Score), 2) 
            : 0;

        return new ProtocolDto(
            i.Id,
            i.Candidate.FullName,
            i.Vacancy.Title,
            i.ScheduledAt,
            i.Status,
            i.Summary,
            avg,
            lines,
            i.Decision?.DecisionType.ToString()
        );
    }
}