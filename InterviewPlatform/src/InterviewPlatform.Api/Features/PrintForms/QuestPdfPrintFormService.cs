using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Entities;
using InterviewPlatform.Api.Domain.Enums;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InterviewPlatform.Api.Features.PrintForms;

public class QuestPdfPrintFormService(AppDbContext db, ICurrentUser currentUser) : IPrintFormService
{
    public async Task<GeneratedFile> GenerateAsync(Guid interviewId, DocumentType type, CancellationToken ct)
    {
        var i = await db.Interviews.AsNoTracking()
            .Include(x => x.Candidate).Include(x => x.Vacancy)
            .Include(x => x.Scores).ThenInclude(s => s.Competency)
            .Include(x => x.Decision)
            .FirstOrDefaultAsync(x => x.Id == interviewId, ct)
            ?? throw new NotFoundException("Собеседование не найдено");

        byte[] pdf = type switch
        {
            DocumentType.OfferLetter or DocumentType.RejectionLetter => BuildLetter(i, type),
            DocumentType.InterviewProtocol => BuildProtocol(i),
            _ => throw new ValidationException("Для данного типа печатной формы нет генератора"),
        };

        var fileName = $"{type}_{i.Candidate.FullName}_{DateTime.UtcNow:yyyyMMdd}.pdf".Replace(' ', '_');

        // регистрируем факт генерации
        var template = await db.DocumentTemplates.FirstOrDefaultAsync(t => t.Type == type, ct);
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

    private static byte[] BuildLetter(Interview i, DocumentType type)
    {
        var isOffer = type == DocumentType.OfferLetter;
        var title = isOffer ? "Приглашение на работу" : "Уведомление об отказе";
        var body = isOffer
            ? $"Уважаемый(ая) {i.Candidate.FullName}! Рады предложить вам позицию «{i.Vacancy.Title}»."
            : $"Уважаемый(ая) {i.Candidate.FullName}! Благодарим за участие в собеседовании на позицию «{i.Vacancy.Title}». К сожалению, мы приняли решение не продолжать процесс.";

        return Document.Create(c => c.Page(p =>
        {
            p.Size(PageSizes.A4); p.Margin(2, Unit.Centimetre);
            p.DefaultTextStyle(s => s.FontSize(12).FontFamily("Arial"));
            p.Header().Text(title).FontSize(18).Bold();
            p.Content().PaddingVertical(20).Column(col =>
            {
                col.Spacing(12);
                col.Item().Text(body);
                col.Item().Text($"Дата: {DateTime.UtcNow:dd.MM.yyyy}");
            });
            p.Footer().AlignCenter().Text(t => { t.Span("Стр. "); t.CurrentPageNumber(); });
        })).GeneratePdf();
    }

    private static byte[] BuildProtocol(Interview i)
    {
        var avg = i.Scores.Count > 0 ? Math.Round(i.Scores.Average(s => s.Score), 2) : 0;
        return Document.Create(c => c.Page(p =>
        {
            p.Size(PageSizes.A4); p.Margin(2, Unit.Centimetre);
            p.DefaultTextStyle(s => s.FontSize(11).FontFamily("Arial"));
            p.Header().Text("Протокол собеседования").FontSize(18).Bold();
            p.Content().PaddingVertical(15).Column(col =>
            {
                col.Spacing(8);
                col.Item().Text($"Кандидат: {i.Candidate.FullName}");
                col.Item().Text($"Вакансия: {i.Vacancy.Title}");
                col.Item().Text($"Дата: {i.ScheduledAt:dd.MM.yyyy HH:mm}");
                col.Item().PaddingTop(10).Text("Оценки по компетенциям:").Bold();
                col.Item().Table(t =>
                {
                    t.ColumnsDefinition(d => { d.RelativeColumn(4); d.ConstantColumn(50); d.RelativeColumn(5); });
                    t.Header(h =>
                    {
                        h.Cell().Element(CellStyle).Text("Компетенция").Bold();
                        h.Cell().Element(CellStyle).Text("Балл").Bold();
                        h.Cell().Element(CellStyle).Text("Комментарий").Bold();
                    });
                    foreach (var s in i.Scores.OrderBy(x => x.Competency.Name))
                    {
                        t.Cell().Element(CellStyle).Text(s.Competency.Name);
                        t.Cell().Element(CellStyle).Text(s.Score.ToString());
                        t.Cell().Element(CellStyle).Text(s.Comment ?? "");
                    }
                });
                col.Item().PaddingTop(8).Text($"Средний балл: {avg}").Bold();
                if (!string.IsNullOrWhiteSpace(i.Summary))
                    col.Item().Text($"Заключение: {i.Summary}");
                if (i.Decision is not null)
                    {
                        var decisionText = i.Decision.DecisionType.ToString() switch
                        {
                            "Offer" => "Оффер",
                            "Reject" => "Отказ",
                            "Hold" => "Отложить",
                            _ => i.Decision.DecisionType.ToString() // на случай, если статус пустой или другой
                        };
                        
                        col.Item().Text($"Решение: {decisionText}");
                    }
            });
            p.Footer().AlignCenter().Text(t => { t.Span("Стр. "); t.CurrentPageNumber(); });
        })).GeneratePdf();

        static IContainer CellStyle(IContainer c) =>
            c.Border(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(4);
    }
}
