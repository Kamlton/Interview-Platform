using InterviewPlatform.Api.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace InterviewPlatform.Api.Common;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException   => (StatusCodes.Status404NotFound,   "Не найдено"),
            ValidationException => (StatusCodes.Status400BadRequest, "Ошибка валидации"),
            ConflictException   => (StatusCodes.Status409Conflict,   "Конфликт"),
            UnauthorizedException => (StatusCodes.Status401Unauthorized, "Не авторизовано"),
            _                   => (StatusCodes.Status500InternalServerError, "Внутренняя ошибка")
        };
        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(ex, "Необработанное исключение");

        var problem = new ProblemDetails { Status = status, Title = title, Detail = ex.Message };
        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(problem, ct);
        return true;
    }
}
