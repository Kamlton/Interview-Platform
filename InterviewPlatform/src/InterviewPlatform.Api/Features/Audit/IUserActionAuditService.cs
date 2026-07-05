namespace InterviewPlatform.Api.Features.Audit;

/// <summary>
/// Сервис аудита действий авторизованных пользователей:
/// переходы по страницам, нажатия кнопок и т.п.
/// Не путать с <see cref="Common.IAuditService"/> — тот пишет
/// аудит изменений сущностей в БД.
/// </summary>
public interface IUserActionAuditService
{
    /// <summary>
    /// Записывает одно действие пользователя в его персональный json-журнал.
    /// Время (UTC) проставляется самим сервисом.
    /// </summary>
    Task LogActionAsync(string username, string role, string action);

    /// <summary>
    /// Читает и десериализует всю историю действий указанного пользователя.
    /// Если журнал ещё не создавался — возвращает пустой список.
    /// </summary>
    Task<IReadOnlyList<AuditLogEntry>> GetUserHistoryAsync(string username);
}
