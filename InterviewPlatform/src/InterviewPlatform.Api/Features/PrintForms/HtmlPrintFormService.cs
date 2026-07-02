using System.Net;
using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Domain.Enums;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Features.PrintForms;

public class HtmlPrintFormService(AppDbContext db, ICurrentUser currentUser, IHtmlToPdfConverter converter)
    : IPrintFormService
{
    public async Task<GeneratedFile> GenerateAsync(Guid interviewId, DocumentType type, CancellationToken ct)
    {
        var i = await db.Interviews.AsNoTracking()
            .Include(x => x.Candidate).Include(x => x.Vacancy).Include(x => x.Interviewer)
            .Include(x => x.Scores).ThenInclude(s => s.Competency)
            .Include(x => x.Decision)
            .FirstOrDefaultAsync(x => x.Id == interviewId, ct)
            ?? throw new NotFoundException("Собеседование не найдено");

        var template = await db.DocumentTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Type == type, ct);
        var html = template?.HtmlBody ?? DefaultTemplates.For(type);

        var rendered = HtmlTemplateEngine.Render(html, BuildData(i, type));
        var pdf = await converter.ConvertAsync(rendered, ct);

        var fileName = $"{type}_{i.Candidate.FullName}_{DateTime.UtcNow:yyyyMMdd}.pdf".Replace(' ', '_');
        if (template is not null)
        {
            db.GeneratedDocuments.Add(new GeneratedDocument
            {
                Id = Guid.NewGuid(), TemplateId = template.Id, Type = type,
                InterviewId = i.Id, CandidateId = i.CandidateId, FileName = fileName,
                GeneratedByUserId = currentUser.Id ?? Guid.Empty,
            });
            await db.SaveChangesAsync(ct);
        }
        return new GeneratedFile(fileName, pdf);
    }

    private static Dictionary<string, string> BuildData(Interview i, DocumentType type)
    {
        var avg = i.Scores.Count > 0 ? Math.Round(i.Scores.Average(s => s.Score), 2) : 0;
        var decision = i.Decision?.DecisionType switch
        {
            DecisionType.Offer => "Оффер",
            DecisionType.Reject => "Отказ",
            DecisionType.Hold => "Отложено",
            _ => "—",
        };

        var rows = string.Concat(i.Scores.OrderBy(s => s.Competency.Name).Select(s =>
            $"<tr><td>{WebUtility.HtmlEncode(s.Competency.Name)}</td>" +
            $"<td>{s.Score}</td>" +
            $"<td>{WebUtility.HtmlEncode(s.Comment ?? "")}</td></tr>"));

        return new Dictionary<string, string>
        {
            ["CandidateName"] = i.Candidate.FullName,
            ["VacancyTitle"] = i.Vacancy.Title,
            ["InterviewerName"] = i.Interviewer.FullName,
            ["ScheduledAt"] = i.ScheduledAt.ToString("dd.MM.yyyy HH:mm"),
            ["Date"] = DateTime.UtcNow.ToString("dd.MM.yyyy"),
            ["AverageScore"] = avg.ToString("0.##"),
            ["Summary"] = i.Summary ?? "—",
            ["Decision"] = decision,
            ["ScoresTable"] = rows,   
            ["DocumentType"] = type.ToString(),
        };
    }
}
