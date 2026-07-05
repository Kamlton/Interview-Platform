using System.Collections.Concurrent;
using System.Text.Json;
using InterviewPlatform.Api.Common;

namespace InterviewPlatform.Api.Features.Audit;

/// <summary>
/// Хранит журнал действий каждого пользователя в отдельном json-файле
/// в формате JSON Lines: одна запись — одна строка файла.
/// Регистрировать в DI нужно как Singleton — см. комментарий у _fileLocks.
/// </summary>
public class UserActionAuditService : IUserActionAuditService
{
    private readonly string _logsDirectory;
    private readonly ILogger<UserActionAuditService> _logger;

    // Своя блокировка на каждого пользователя. Без неё два параллельных запроса
    // (два быстрых клика, две открытые вкладки) могут писать в файл одновременно
    // и повредить его. Работает в пределах одного процесса — при масштабировании
    // на несколько инстансов нужен будет общий сторедж вместо локального диска.
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _fileLocks = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false // важно: каждая запись обязана занимать ровно одну строку
    };

    public UserActionAuditService(IWebHostEnvironment env, ILogger<UserActionAuditService> logger)
    {
        _logger = logger;
        // ContentRootPath, а не WebRootPath: логи не должны быть доступны
        // напрямую по ссылке из wwwroot.
        _logsDirectory = Path.Combine(env.ContentRootPath, "AuditLogs");
        Directory.CreateDirectory(_logsDirectory);
    }

    public async Task LogActionAsync(string username, string role, string action)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ValidationException("Username обязателен.");
        if (string.IsNullOrWhiteSpace(action))
            throw new ValidationException("Action обязателен.");

        var entry = new AuditLogEntry
        {
            Username = username,
            Role = string.IsNullOrWhiteSpace(role) ? "unknown" : role,
            Timestamp = DateTime.UtcNow,
            Action = action
        };

        var line = JsonSerializer.Serialize(entry, JsonOptions);
        var semaphore = _fileLocks.GetOrAdd(username, _ => new SemaphoreSlim(1, 1));

        await semaphore.WaitAsync();
        try
        {
            await File.AppendAllTextAsync(GetUserFilePath(username), line + Environment.NewLine);
        }
        catch (Exception ex)
        {
            // Сбой записи аудита не должен ронять основное действие пользователя.
            _logger.LogError(ex, "Не удалось записать событие аудита для {Username}", username);
        }
        finally
        {
            semaphore.Release();
        }
    }

    public async Task<IReadOnlyList<AuditLogEntry>> GetUserHistoryAsync(string username)
    {
        var filePath = GetUserFilePath(username);
        if (!File.Exists(filePath))
            return Array.Empty<AuditLogEntry>();

        var semaphore = _fileLocks.GetOrAdd(username, _ => new SemaphoreSlim(1, 1));
        string[] lines;
        await semaphore.WaitAsync();
        try
        {
            lines = await File.ReadAllLinesAsync(filePath);
        }
        finally
        {
            semaphore.Release();
        }

        var result = new List<AuditLogEntry>(lines.Length);
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            try
            {
                var entry = JsonSerializer.Deserialize<AuditLogEntry>(line, JsonOptions);
                if (entry is not null)
                    result.Add(entry);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Повреждённая строка в журнале {Username} — пропущена", username);
            }
        }

        return result;
    }

    private string GetUserFilePath(string username)
    {
        // Убираем символы, недопустимые в имени файла (в т.ч. "/" и "\"),
        // чтобы через username нельзя было выйти за пределы папки AuditLogs.
        var invalidChars = Path.GetInvalidFileNameChars();
        var safeName = new string(username.Where(c => !invalidChars.Contains(c)).ToArray())
            .ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(safeName))
            safeName = "unknown_user";

        return Path.Combine(_logsDirectory, $"{safeName}.json");
    }
}
