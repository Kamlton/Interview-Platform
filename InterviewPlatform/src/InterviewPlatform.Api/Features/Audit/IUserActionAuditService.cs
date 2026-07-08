namespace InterviewPlatform.Api.Features.Audit;

/// <summary>
/// Сервис аудита действий авторизованных пользователей — читаемые записи
/// бизнес-операций («Создана вакансия "…"», «Кандидат … переведён в архив»).
/// Не путать с <see cref="Common.IAuditService"/> — тот пишет
/// аудит изменений сущностей в БД.
/// </summary>
public interface IUserActionAuditService
{
    /// <summary>
    /// Записывает одно действие пользователя в его персональный json-журнал.
    /// Время (UTC) проставляется самим сервисом.
    /// </summary>
    /// <param name="link">Необязательный маршрут раздела во фронтенде для перехода из журнала.</param>
    Task LogActionAsync(string username, string role, string action, string? link = null);

    /// <summary>
    /// То же, но имя и роль берутся из JWT-клеймов текущего HTTP-запроса.
    /// Вне запроса (сидинг, фоновые задачи) вызов тихо игнорируется.
    /// </summary>
    Task LogCurrentUserAsync(string action, string? link = null);

    /// <summary>
    /// Читает и десериализует всю историю действий указанного пользователя.
    /// Если журнал ещё не создавался — возвращает пустой список.
    /// </summary>
    Task<IReadOnlyList<AuditLogEntry>> GetUserHistoryAsync(string username);

    /// <summary>
    /// Сводный журнал: действия всех пользователей, отсортированные от новых к старым.
    /// </summary>
    Task<IReadOnlyList<AuditLogEntry>> GetAllHistoryAsync();
}
