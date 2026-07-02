using InterviewPlatform.Api.Domain.Enums;

namespace InterviewPlatform.Api.Features.PrintForms;

public static class DefaultTemplates
{
    private const string Css = @"
        <style>
          body { font-family: Arial, 'DejaVu Sans', sans-serif; color: #1A2230; font-size: 14px; line-height: 1.55; }
          h1 { color: #2E5A88; font-size: 22px; margin: 0 0 16px; }
          h2 { color: #1F3A57; font-size: 16px; margin: 22px 0 10px; }
          .meta { color: #555; margin-top: 20px; }
          .sign { margin-top: 40px; }
          table.kv td { padding: 3px 10px 3px 0; vertical-align: top; }
          table.kv td.k { color: #6B7785; white-space: nowrap; }
          table.scores { width: 100%; border-collapse: collapse; margin-top: 6px; }
          table.scores th, table.scores td { border: 1px solid #CBD5E1; padding: 6px 9px; text-align: left; font-size: 13px; }
          table.scores th { background: #EEF3F9; color: #1F3A57; }
        </style>
        ";

    public const string Offer = @"
        <!doctype html><html lang=""ru""><head><meta charset=""utf-8"">" + Css + @"</head><body>
          <h1>Приглашение на работу</h1>
          <p>Уважаемый(ая) {{CandidateName}}!</p>
          <p>По итогам собеседования рады предложить вам позицию «{{VacancyTitle}}».</p>
          <p>Будем рады видеть вас в нашей команде.</p>
          <p class=""meta"">Дата: {{Date}}</p>
          <p class=""sign"">С уважением, отдел кадров</p>
        </body></html>
        ";

    public const string Rejection = @"
        <!doctype html><html lang=""ru""><head><meta charset=""utf-8"">" + Css + @"</head><body>
          <h1>Уведомление об итогах собеседования</h1>
          <p>Уважаемый(ая) {{CandidateName}}!</p>
          <p>Благодарим за участие в собеседовании на позицию «{{VacancyTitle}}».</p>
          <p>К сожалению, по результатам мы приняли решение не продолжать процесс. Желаем успехов в поиске работы.</p>
          <p class=""meta"">Дата: {{Date}}</p>
          <p class=""sign"">С уважением, отдел кадров</p>
        </body></html>
        ";

    public const string Protocol = @"
        <!doctype html><html lang=""ru""><head><meta charset=""utf-8"">" + Css + @"</head><body>
          <h1>Протокол собеседования</h1>
          <table class=""kv"">
            <tr><td class=""k"">Кандидат</td><td>{{CandidateName}}</td></tr>
            <tr><td class=""k"">Вакансия</td><td>{{VacancyTitle}}</td></tr>
            <tr><td class=""k"">Интервьюер</td><td>{{InterviewerName}}</td></tr>
            <tr><td class=""k"">Дата</td><td>{{ScheduledAt}}</td></tr>
          </table>
          <h2>Оценки по компетенциям</h2>
          <table class=""scores"">
            <thead><tr><th>Компетенция</th><th>Балл</th><th>Комментарий</th></tr></thead>
            <tbody>{{{ScoresTable}}}</tbody>
          </table>
          <p class=""meta""><b>Средний балл:</b> {{AverageScore}}</p>
          <p><b>Заключение:</b> {{Summary}}</p>
          <p><b>Решение:</b> {{Decision}}</p>
        </body></html>
        ";

    public static string For(DocumentType type) => type switch
    {
        DocumentType.OfferLetter => Offer,
        DocumentType.RejectionLetter => Rejection,
        DocumentType.InterviewProtocol => Protocol,
        _ => Offer,
    };
}