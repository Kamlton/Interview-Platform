using System.Text;
using InterviewPlatform.Api.Auth;
using InterviewPlatform.Api.Common;
using InterviewPlatform.Api.Domain.Constants;
using InterviewPlatform.Api.Features.Auth;
using InterviewPlatform.Api.Features.Candidates;
using InterviewPlatform.Api.Features.Interviews;
using InterviewPlatform.Api.Features.Assessment;
using InterviewPlatform.Api.Features.Audit;
using InterviewPlatform.Api.Features.PrintForms;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using InterviewPlatform.Api.Features.Archive;

var builder = WebApplication.CreateBuilder(args);

// ----- QuestPDF (Community-лицензия) -----
QuestPDF.Settings.License = LicenseType.Community;

// ----- БД -----
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ----- Аутентификация и авторизация -----
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.AdminOnly, p => p.RequireRole(Roles.Admin))
    .AddPolicy(Policies.HrOrAdmin, p => p.RequireRole(Roles.Hr, Roles.Admin))
    .AddPolicy(Policies.DeciderOrAdmin, p => p.RequireRole(Roles.Decider, Roles.Admin));

// ----- DI -----
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ArchiveService>();
// Файловый аудит действий пользователя (клики, переходы). Singleton — сервис
// держит словарь блокировок на файлы, он должен быть один на процесс.
builder.Services.AddSingleton<IUserActionAuditService, UserActionAuditService>();
builder.Services.AddScoped<CandidateService>();
builder.Services.AddScoped<InterviewService>();
builder.Services.AddScoped<AssessmentService>();

// Движок печатных форм: "Html" (HTML-шаблон -> PDF через Chromium) или "QuestPdf" (код-макет).
var printEngine = builder.Configuration["PrintForms:Engine"] ?? "QuestPdf";
if (string.Equals(printEngine, "Html", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IHtmlToPdfConverter, PuppeteerHtmlToPdfConverter>();
    builder.Services.AddScoped<IPrintFormService, HtmlPrintFormService>();
}
else
{
    builder.Services.AddScoped<IPrintFormService, QuestPdfPrintFormService>();
}

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// ----- CORS для SPA -----
const string SpaCors = "spa";
builder.Services.AddCors(o => o.AddPolicy(SpaCors, b => b
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader().AllowAnyMethod()));

// ----- MVC + Swagger -----
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Interview Platform API", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer",
        BearerFormat = "JWT", In = ParameterLocation.Header,
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = Array.Empty<string>() });
});

var app = builder.Build();

app.UseExceptionHandler();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors(SpaCors);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
try
    {
        var context = services.GetRequiredService<AppDbContext>(); 
        await context.Database.MigrateAsync(); 
        Console.WriteLine("База данных успешно обновлена!");

        var hasher = services.GetRequiredService<IPasswordHasher>();
        var config = services.GetRequiredService<IConfiguration>();
        await DbSeeder.SeedAsync(context, hasher, config);
        Console.WriteLine("База данных успешно наполнена начальными данными (Seed)!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Ошибка при автоматическом обновлении базы: {ex.Message}");
    }
}

app.Run();

public partial class Program { }
