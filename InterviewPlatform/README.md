# Платформа для технических собеседований — Backend (.NET 10)

Backend-каркас информационной системы ведения базы кандидатов и проведения
технических собеседований. Реализован на **.NET 10 + ASP.NET Core Web API +
Entity Framework Core + PostgreSQL**. Модель данных и сценарии соответствуют
проектной документации (этап аналитики).

> Это **стартовый каркас** для команды практики: доменная модель, миграции,
> аутентификация с ролями и ключевые сценарии реализованы; остальное команда
> дописывает по тем же шаблонам.

## Технологии

- .NET 10 (C#), ASP.NET Core Web API (контроллеры)
- Entity Framework Core 10 + Npgsql (PostgreSQL)
- JWT-аутентификация, ролевая авторизация (RBAC)
- QuestPDF — генерация печатных форм (PDF)
- Swagger (Swashbuckle) — документация и тестирование API

## Предварительные требования

- .NET 10 SDK
- PostgreSQL (локально или через Docker — см. `docker-compose.yml`)
- EF Core CLI: `dotnet tool install --global dotnet-ef`

## Быстрый старт

```bash
# 1. Поднять PostgreSQL
docker compose up -d

# 2. Восстановить зависимости
dotnet restore

# 3. Создать первую миграцию (один раз)
dotnet ef migrations add Initial \
  --project src/InterviewPlatform.Api \
  --startup-project src/InterviewPlatform.Api

# 4. Запустить (миграции и сидинг выполняются автоматически при старте)
dotnet run --project src/InterviewPlatform.Api
```

После запуска Swagger доступен по адресу `http://localhost:5080/swagger`.

### Учётная запись администратора (сид)

| E-mail        | Пароль        |
|---------------|---------------|
| `admin@local` | `Admin#12345` |

Значения настраиваются в `appsettings.json` → секция `Seed`. При первом старте
также создаются роли (`Администратор`, `Отдел кадров`, `Решала`), демо-компетенции
и шаблон оффера.

## Конфигурация

`src/InterviewPlatform.Api/appsettings.json`:

- `ConnectionStrings:Postgres` — строка подключения к БД.
- `Jwt:Key` — секрет подписи токена (**обязательно сменить**, ≥ 32 символов).
- `Cors:Origins` — адреса SPA-фронтенда.
- `Seed:*` — учётка администратора по умолчанию.

## Печатные формы (движки)

Печать реализована за интерфейсом `IPrintFormService` с выбором движка через
`appsettings.json` → `PrintForms:Engine`:

- `QuestPdf` (по умолчанию) — PDF собирается кодом (QuestPDF). Работает офлайн,
  ничего не качает — удобно для первого запуска.
- `Html` — путь из ТЗ: PDF рендерится из **HTML-шаблона** (`DocumentTemplate.HtmlBody`)
  через headless Chromium (PuppeteerSharp). Chromium скачивается при первом запросе
  (нужен интернет); путь кеша — `PrintForms:ChromiumCachePath`.

Шаблоны (оффер, отказ, протокол) создаются сидером в таблице `DocumentTemplates`
и редактируются без пересборки. Плейсхолдеры: `{{Key}}` — с экранированием,
`{{{Key}}}` — как HTML (например, `{{{ScoresTable}}}` в протоколе). Доступные
ключи: `CandidateName`, `VacancyTitle`, `InterviewerName`, `ScheduledAt`, `Date`,
`AverageScore`, `Summary`, `Decision`, `ScoresTable`.

Чтобы переключиться на HTML-движок:

```json
"PrintForms": { "Engine": "Html", "ChromiumCachePath": "" }
```

## Сценарий проверки (end-to-end)

1. `POST /api/auth/login` под админом → получить JWT, нажать **Authorize** в Swagger.
2. `POST /api/users` — создать пользователей с ролями «Отдел кадров» и «Решала».
3. `POST /api/vacancies`, `POST /api/competencies` — справочники.
4. `POST /api/matrices` — собрать матрицу из компетенций.
5. `POST /api/candidates` — завести кандидата (с навыками).
6. `POST /api/interviews` — назначить собеседование (можно несколько на кандидата).
7. `PUT /api/interviews/{id}/scores` — выставить оценки 1–5 и комментарии.
8. `GET /api/interviews/{id}/protocol` — посмотреть протокол.
9. `POST /api/interviews/{id}/decision` (роль «Решала») — оффер/отказ.
10. `GET /api/interviews/{id}/print/OfferLetter` — скачать печатную форму PDF.

## Обзор API

| Метод/маршрут | Назначение | Доступ |
|---|---|---|
| `POST /api/auth/login` | Авторизация (access + refresh) | Все |
| `POST /api/auth/refresh` | Обновление токенов по refresh (ротация) | Все |
| `POST /api/auth/logout` | Отзыв refresh-токена | Авторизован |
| `POST /api/auth/change-password` | Смена пароля | Авторизован |
| `GET/POST /api/users` | Реестр и добавление пользователей | Администратор |
| `GET/POST/PUT /api/candidates` | Реестр и карточка кандидата | HR, Админ |
| `POST /api/candidates/{id}/archive` | Архивация | HR, Админ |
| `GET/POST/PUT /api/vacancies` | Реестр вакансий | HR, Админ |
| `GET/POST /api/competencies` | Каталог компетенций | HR, Админ |
| `GET/POST /api/matrices` | Матрица компетенций | HR, Админ |
| `GET/POST /api/interviews` | Реестр и карточка собеседования | Авторизован |
| `PUT /api/interviews/{id}/scores` | Заполнение матрицы (оценки) | HR, Админ |
| `GET /api/interviews/{id}/protocol` | Протокол собеседования | Авторизован |
| `POST /api/interviews/{id}/decision` | Решение по кандидату | Решала, Админ |
| `GET /api/interviews/{id}/print/{type}` | Печатная форма PDF | Авторизован |

`type` ∈ `OfferLetter`, `RejectionLetter`, `InterviewProtocol`.

## Тесты

Тесты лежат в `tests/InterviewPlatform.Api.Tests` (xUnit). Интеграционные тесты
поднимают **реальный PostgreSQL в контейнере** (Testcontainers) и приложение
в памяти (`WebApplicationFactory`), поэтому для них нужен запущенный **Docker**.

```bash
dotnet test
```

Покрытие:

- Юнит: PBKDF2-хэш паролей, JWT (состав claims), HTML-шаблонизатор.
- Интеграция (через HTTP):
  - авторизация: успех, неверный пароль (401), доступ без токена (401);
  - роли: HR не может создавать пользователей (403), Решала — кандидатов (403);
  - сквозной сценарий: HR заводит вакансию, кандидата и собеседование, выставляет
    оценки (средний балл 4.5), Решала принимает оффер — кандидат переходит в статус
    «нанят».

Схема БД в тестах создаётся из модели (`EnsureCreated`) — отдельная миграция не
требуется. Для прод-окружения, когда миграции добавлены, тот же код применяет их
(`Migrate`).

## Структура проекта

```
src/InterviewPlatform.Api/
├── Program.cs                  // DI, EF Core, JWT, политики, Swagger, миграции+сидинг
├── Domain/
│   ├── Entities/               // 17 сущностей модели данных
│   ├── Enums/                  // DecisionType, DocumentType, статусы
│   └── Constants/              // Roles, Policies
├── Infrastructure/
│   ├── AppDbContext.cs         // DbSets + Fluent-конфигурация
│   ├── AuditService.cs         // журнал изменений
│   └── DbSeeder.cs             // первичное наполнение
├── Auth/                       // JWT, PBKDF2-хэш паролей
├── Common/                     // пагинация, исключения, ProblemDetails, ICurrentUser
└── Features/                   // вертикальные срезы (контроллер + сервис + DTO)
    ├── Auth, Users, Candidates, Vacancies, Competencies,
    ├── Matrices, Interviews, Assessment, Decisions, PrintForms
```

## Соответствие требованиям ТЗ

| Требование ТЗ | Где реализовано |
|---|---|
| 4.1 Админ добавляет пользователя | `Features/Users` |
| 4.2 Авторизация | `Features/Auth` |
| 4.3 Карточка кандидата | `Features/Candidates` |
| 4.4 Реестр кандидатов | `CandidatesController.Registry` (поиск + пагинация) |
| 4.5–4.6 Собеседования, неск. на кандидата | `Features/Interviews` |
| 4.7 Заполнение матрицы компетенций | `Features/Assessment` |
| 4.8 Генерация печатных форм | `Features/PrintForms` |
| 4.8 (Решала) решение по кандидату | `Features/Decisions` |
| Бонус: реестр вакансий | `Features/Vacancies` |
| Бонус: архивация | `*/archive`, флаги `IsArchived` |
| Бонус: журнал изменений | `Infrastructure/AuditService` + `AuditLog` |

## Что доработать команде

- Миграции и индексы под реальные объёмы; уникальность и валидация на уровне DTO
  (например, FluentValidation).
- Печатные формы: HTML-движок (Puppeteer) уже реализован; при желании заменить
  Chromium на Playwright/wkhtmltopdf — достаточно своей реализации `IHtmlToPdfConverter`.
- Refresh-токены и смена пароля реализованы; осталось: блокировка/деактивация
  пользователей, сброс пароля администратором.
- Полноценный экран «Настройка прав» (таблицы `Permission`/`RolePermission`
  уже заведены в модели).
- Тесты: базовый набор (xUnit + Testcontainers) уже есть в `tests/`; покрытие
  расширяется по мере роста функциональности.
```
