import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
// Добавили хук useSearchParams для чтения query-параметров (?candidateId=...)
import { useNavigate, useSearchParams } from "react-router-dom";
import { interviewsApi, candidatesApi, vacanciesApi } from "../api";
import { apiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastContext"; 
import type { Paged, InterviewListItem, CandidateListItem, Vacancy } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, StatusBadge, Pagination } from "../components/ui";
import { DatePicker } from "../components/DatePicker";
import { TimeSelect } from "../components/TimeSelect";
import {
  combineDateAndTime, getBlockedTimesForDate, getScheduledTimesForDate, toLocalDateString,
} from "../utils/interviewSchedule";

type SortField = "candidateName" | "vacancyTitle" | "interviewerName" | "scheduledAt" | "status";
type SortOrder = "asc" | "desc" | null;
type DropdownType = "vacancy" | "interviewer" | "date" | "status" | null;
const STATUS_RU: Record<string, string> = {
  New: "Новый", 
  InProgress: "Отложен", 
  Hired: "Оффер", 
  Rejected: "Отказ",
  Planned: "Запланировано", 
  Completed: "Проведено", 
  Cancelled: "Отменено",
};

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // <- Инициализируем работу с параметрами URL
  const candidateIdParam = searchParams.get("candidateId");   // <- Достаем ID кандидата из ссылки

  const { hasRole, userId } = useAuth();
  const canCreate = hasRole("Администратор", "Отдел кадров");

  const [data, setData] = useState<Paged<InterviewListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);

  // Состояния загрузки, поднятые из CreateInterview для управления кнопкой в шапке
  const [busy, setBusy] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Сортировка таблицы
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Режим фильтрации и дропдауны
  const [isFilterModeActive, setIsFilterModeActive] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);

  // Временные выбранные фильтры (до клика на OK)
  const [selectedVacancies, setSelectedVacancies] = useState<string[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Применённые фильтры для рендеринга
  const [appliedVacancies, setAppliedVacancies] = useState<string[]>([]);
  const [appliedInterviewers, setAppliedInterviewers] = useState<string[]>([]);
  const [appliedDates, setAppliedDates] = useState<string[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Если в URL передан candidateId, автоматически открываем форму создания
  useEffect(() => {
    if (candidateIdParam) {
      setShowForm(true);
    }
  }, [candidateIdParam]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    const t = setTimeout(() => {
      interviewsApi.registry(page, 20, search)
        .then((d) => active && setData(d))
        .catch((e) => active && setError(apiError(e)))
        .finally(() => active && setLoading(false));
    }, search ? 300 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [page, search, reload]);

  // Закрытие дропдаунов по клику снаружи
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Получение уникальных значений для фильтров из текущей страницы данных
  const getUniqueValues = (type: DropdownType): string[] => {
    if (!data?.items) return [];
    
    if (type === "date") {
      const dates = data.items.map(item => 
        new Date(item.scheduledAt).toLocaleDateString("ru-RU", { dateStyle: "short" })
      );
      return Array.from(new Set(dates)).sort();
    }
    
    const fieldMap: Record<string, keyof InterviewListItem> = {
      vacancy: "vacancyTitle",
      interviewer: "interviewerName",
      status: "status"
    };

    const field = fieldMap[type || ""];
    if (!field) return [];

    const values = data.items.map(item => item[field] || "—");
    return Array.from(new Set(values)).sort();
  };

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortField(null);
      setSortOrder(null);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return "  ↕";
    if (sortOrder === "asc") return "  ↓";
    if (sortOrder === "desc") return "  ↑";
    return "  ↕";
  };

  // Обработчики чекбоксов во временных состояниях
  const handleToggleVacancy = (val: string) => {
    setSelectedVacancies(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const handleToggleInterviewer = (val: string) => {
    setSelectedInterviewers(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const handleToggleDate = (val: string) => {
    setSelectedDates(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const handleToggleStatus = (val: string) => {
    setSelectedStatuses(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  // Подтверждение фильтров
  const applyVacancyFilter = () => { setAppliedVacancies(selectedVacancies); setActiveDropdown(null); };
  const applyInterviewerFilter = () => { setAppliedInterviewers(selectedInterviewers); setActiveDropdown(null); };
  const applyDateFilter = () => { setAppliedDates(selectedDates); setActiveDropdown(null); };
  const applyStatusFilter = () => { setAppliedStatuses(selectedStatuses); setActiveDropdown(null); };

  async function handleArchive(id: string, archived: boolean) {
    if (!confirm(`Отправить собеседование в архив?`)) return;
    try {
      await interviewsApi.archive(id, archived);
      setReload((x) => x + 1);
    } catch (e) {
      setError(apiError(e));
    }
  }

  // Фильтрация и сортировка данных локально на клиенте
  const getProcessedItems = (): InterviewListItem[] => {
    if (!data?.items) return [];
    let result = [...data.items];

    // 1. Применение фильтров колонок
    if (isFilterModeActive) {
      if (appliedVacancies.length > 0) {
        result = result.filter(item => appliedVacancies.includes(item.vacancyTitle || "—"));
      }
      if (appliedInterviewers.length > 0) {
        result = result.filter(item => appliedInterviewers.includes(item.interviewerName || "—"));
      }
      if (appliedDates.length > 0) {
        result = result.filter(item => {
          const itemDateStr = new Date(item.scheduledAt).toLocaleDateString("ru-RU", { dateStyle: "short" });
          return appliedDates.includes(itemDateStr);
        });
      }
      if (appliedStatuses.length > 0) {
        result = result.filter(item => appliedStatuses.includes(item.status));
      }
    }

    // 2. Применение сортировки
    if (!sortField || !sortOrder) return result;

    return result.sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "scheduledAt") {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }

      valA = valA.toLowerCase();
      valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const processedItems = getProcessedItems();

  const isVacancyFilterApplied = appliedVacancies.length > 0;
  const isInterviewerFilterApplied = appliedInterviewers.length > 0;
  const isDateFilterApplied = appliedDates.length > 0;
  const isStatusFilterApplied = appliedStatuses.length > 0;

  return (
    <>
      <style>{`
        .interview-table th.filterable-th {
          position: relative;
        }
        
        .interview-table th.filterable-th.filter-mode-active {
          padding-right: 100px !important;
        }

        @media (max-width: 1024px) {
          .interview-table th.filterable-th.filter-mode-active {
            padding-right: 36px !important;
          }
        }
      `}</style>

      <PageHeader title="Собеседования">
        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          {canCreate && (
            <>
              {showForm ? (
                <>
                  <button 
                    className="btn" 
                    type="submit"
                    form="create-interview-form"
                    disabled={busy || loadingSchedule}
                  >
                    {busy ? "Создаем…" : "Создать"}
                  </button>

                  <div style={{
                    width: "1px",
                    backgroundColor: "var(--border-color, #ccc)",
                    alignSelf: "stretch",
                    opacity: 0.6
                  }} />

                  <button 
                    className="btn btn-ghost" 
                    type="button" 
                    onClick={() => {
                      setBusy(false);
                      setLoadingSchedule(false);
                      setShowForm(false);
                      setSearchParams({}); // <- При выходе очищаем ID из ссылки
                    }}
                  >
                    Назад к собеседованиям
                  </button>
                </>
              ) : (
                <button 
                  className="btn" 
                  type="button" 
                  onClick={() => setShowForm(true)}
                >
                  Назначить собеседование
                </button>
              )}
            </>
          )}
        </div>
      </PageHeader>

      {showForm && canCreate && (
        <CreateInterview 
          interviewerId={userId} 
          busy={busy}
          setBusy={setBusy}
          loadingSchedule={loadingSchedule}
          setLoadingSchedule={setLoadingSchedule}
          onCreated={() => { 
            setShowForm(false); 
            setReload((x) => x + 1); 
            setBusy(false);
            setLoadingSchedule(false);
            setSearchParams({}); // <- После успешного создания очищаем ID из ссылки
          }} 
        />
      )}

      <div className="toolbar filter-toolbar">
        <input className="input search" placeholder="Поиск по кандидату или вакансии"
          value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        
        <button
          type="button"
          className={`btn ${isFilterModeActive ? "btn-primary" : "btn-ghost"}`}
          onClick={() => {
            if (isFilterModeActive) {
              setSelectedVacancies([]);
              setSelectedInterviewers([]);
              setSelectedDates([]);
              setSelectedStatuses([]);
              setAppliedVacancies([]);
              setAppliedInterviewers([]);
              setAppliedDates([]);
              setAppliedStatuses([]);
              setActiveDropdown(null);
            }
            setIsFilterModeActive(!isFilterModeActive);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="7" y1="12" x2="17" y2="12"></line>
            <line x1="10" y1="18" x2="14" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className={`panel table-wrap ${activeDropdown ? "dropdown-visible" : ""}`}>
        {loading ? <Spinner /> : error ? <ErrorState message={error} /> :
          !data || processedItems.length === 0 ? (
            <EmptyState title="Собеседований не найдено" hint="Измените фильтры или назначьте новое собеседование." />
          ) : (
            <table className="data interview-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => handleSort("candidateName")}>
                    Кандидат {renderSortIcon("candidateName")}
                  </th>

                  <th className={`filterable-th ${isFilterModeActive ? "filter-mode-active" : ""}`}>
                    <span className="th-label" onClick={() => handleSort("vacancyTitle")}>
                      Вакансия {renderSortIcon("vacancyTitle")}
                    </span>
                    {isFilterModeActive && (
                      <span
                        className={`filter-trigger-btn ${isVacancyFilterApplied ? "filter-active" : ""}`}
                        onClick={() => setActiveDropdown(activeDropdown === "vacancy" ? null : "vacancy")}
                      >
                        ⌄
                      </span>
                    )}
                    {activeDropdown === "vacancy" && (
                      <div ref={dropdownRef} className="filter-dropdown-menu">
                        <div className="filter-dropdown-scroll">
                          {getUniqueValues("vacancy").map(v => (
                            <label key={v} className="filter-dropdown-item">
                              <input type="checkbox" checked={selectedVacancies.includes(v)} onChange={() => handleToggleVacancy(v)} />
                              {v}
                            </label>
                          ))}
                        </div>
                        <button className="btn filter-apply-btn" onClick={applyVacancyFilter}>OK</button>
                      </div>
                    )}
                  </th>

                  <th className={`filterable-th ${isFilterModeActive ? "filter-mode-active" : ""}`}>
                    <span className="th-label" onClick={() => handleSort("interviewerName")}>
                      Интервьюер {renderSortIcon("interviewerName")}
                    </span>
                    {isFilterModeActive && (
                      <span
                        className={`filter-trigger-btn ${isInterviewerFilterApplied ? "filter-active" : ""}`}
                        onClick={() => setActiveDropdown(activeDropdown === "interviewer" ? null : "interviewer")}
                      >
                        ⌄
                      </span>
                    )}
                    {activeDropdown === "interviewer" && (
                      <div ref={dropdownRef} className="filter-dropdown-menu">
                        <div className="filter-dropdown-scroll">
                          {getUniqueValues("interviewer").map(i => (
                            <label key={i} className="filter-dropdown-item">
                              <input type="checkbox" checked={selectedInterviewers.includes(i)} onChange={() => handleToggleInterviewer(i)} />
                              {i}
                            </label>
                          ))}
                        </div>
                        <button className="btn filter-apply-btn" onClick={applyInterviewerFilter}>OK</button>
                      </div>
                    )}
                  </th>

                  <th className={`filterable-th ${isFilterModeActive ? "filter-mode-active" : ""}`}>
                    <span className="th-label" onClick={() => handleSort("scheduledAt")}>
                      Дата {renderSortIcon("scheduledAt")}
                    </span>
                    {isFilterModeActive && (
                      <span
                        className={`filter-trigger-btn ${isDateFilterApplied ? "filter-active" : ""}`}
                        onClick={() => setActiveDropdown(activeDropdown === "date" ? null : "date")}
                      >
                        ⌄
                      </span>
                    )}
                    {activeDropdown === "date" && (
                      <div ref={dropdownRef} className="filter-dropdown-menu">
                        <div className="filter-dropdown-scroll">
                          {getUniqueValues("date").map(d => (
                            <label key={d} className="filter-dropdown-item">
                              <input type="checkbox" checked={selectedDates.includes(d)} onChange={() => handleToggleDate(d)} />
                              {d}
                            </label>
                          ))}
                        </div>
                        <button className="btn filter-apply-btn" onClick={applyDateFilter}>OK</button>
                      </div>
                    )}
                  </th>

                  <th className={`filterable-th ${isFilterModeActive ? "filter-mode-active" : ""}`}>
                    <span className="th-label" onClick={() => handleSort("status")}>
                      Статус {renderSortIcon("status")}
                    </span>
                    {isFilterModeActive && (
                      <span
                        className={`filter-trigger-btn ${isStatusFilterApplied ? "filter-active" : ""}`}
                        onClick={() => setActiveDropdown(activeDropdown === "status" ? null : "status")}
                      >
                        ⌄
                      </span>
                    )}
                    {activeDropdown === "status" && (
                      <div ref={dropdownRef} className="filter-dropdown-menu">
                        <div className="filter-dropdown-scroll">
                          {getUniqueValues("status").map(s => (
                            <label key={s} className="filter-dropdown-item">
                              <input type="checkbox" checked={selectedStatuses.includes(s)} onChange={() => handleToggleStatus(s)} />
                              {STATUS_RU[s] || s} {/* <- Теперь выводится русский перевод, либо сам статус, если перевода нет */}
                            </label>
                          ))}
                        </div>
                        <button className="btn filter-apply-btn" onClick={applyStatusFilter}>OK</button>
                      </div>
                    )}
                  </th>
                  <th style={{ width: 120, textAlign: "center" }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {processedItems.map((iv) => (
                  <tr key={iv.id} className="clickable" onClick={() => navigate(`/interviews/${iv.id}`)}>
                    <td>{iv.candidateName}</td>
                    <td>{iv.vacancyTitle}</td>
                    <td className="muted">{iv.interviewerName}</td>
                    <td className="muted">{new Date(iv.scheduledAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td><StatusBadge status={iv.status} /></td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(iv.id, true);
                        }}
                      >
                        В архив
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}

interface CreateInterviewProps {
  interviewerId: string | null;
  busy: boolean;
  setBusy: (b: boolean) => void;
  loadingSchedule: boolean;
  setLoadingSchedule: (l: boolean) => void;
  onCreated: () => void;
}

function CreateInterview({ 
  interviewerId, 
  setBusy, 
  loadingSchedule, 
  setLoadingSchedule, 
  onCreated 
}: CreateInterviewProps) {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams(); // <- Инициализируем поиск параметров в подкомпоненте
  
  // Если параметр есть, берем его как дефолтное состояние, иначе пустая строка
  const initialCandidateId = searchParams.get("candidateId") || "";

  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidateId, setCandidateId] = useState(initialCandidateId); // <- Подставляем начальный ID
  const [vacancyId, setVacancyId] = useState("");
  const [plan, setPlan] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [vacancyInterviews, setVacancyInterviews] = useState<string[]>([]);
  const [candidateInterviews, setCandidateInterviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([candidatesApi.registry(1, 100, "", false), vacanciesApi.list()])
      .then(([c, v]) => { setCandidates(c.items); setVacancies(v); })
      .catch((e) => setError(apiError(e)));
  }, []);

  useEffect(() => {
    let active = true;

    if (!vacancyId && !candidateId) {
      setVacancyInterviews([]);
      setCandidateInterviews([]);
      setLoadingSchedule(false);
      return;
    }

    setLoadingSchedule(true);
    const requests: Promise<void>[] = [];

    if (vacancyId) {
      requests.push(
        interviewsApi.registry(1, 200, "", undefined, vacancyId)
          .then((data) => {
            if (!active) return;
            setVacancyInterviews(
              data.items.filter((iv) => iv.status !== "Cancelled").map((iv) => iv.scheduledAt),
            );
          }),
      );
    } else {
      setVacancyInterviews([]);
    }

    if (candidateId) {
      requests.push(
        interviewsApi.registry(1, 200, "", candidateId, undefined)
          .then((data) => {
            if (!active) return;
            setCandidateInterviews(
              data.items.filter((iv) => iv.status !== "Cancelled").map((iv) => iv.scheduledAt),
            );
          }),
      );
    } else {
      setCandidateInterviews([]);
    }

    Promise.all(requests)
      .catch((e) => active && setError(apiError(e)))
      .finally(() => active && setLoadingSchedule(false));

    return () => { active = false; };
  }, [vacancyId, candidateId, setLoadingSchedule]);

  const blockedTimes = useMemo(() => {
    if (!scheduledDate) return new Set<string>();
    const blocked = new Set<string>();

    if (vacancyId) {
      const sameDayVacancy = getScheduledTimesForDate(scheduledDate, vacancyInterviews);
      for (const t of getBlockedTimesForDate(scheduledDate, sameDayVacancy, undefined, "vacancy")) {
        blocked.add(t);
      }
    }

    if (candidateId) {
      const sameDayCandidate = getScheduledTimesForDate(scheduledDate, candidateInterviews);
      for (const t of getBlockedTimesForDate(scheduledDate, sameDayCandidate, undefined, "candidate")) {
        blocked.add(t);
      }
    }

    return blocked;
  }, [scheduledDate, vacancyId, candidateId, vacancyInterviews, candidateInterviews]);

  useEffect(() => {
    if (scheduledTime && blockedTimes.has(scheduledTime)) setScheduledTime("");
  }, [blockedTimes, scheduledTime]);

  function onCandidateChange(id: string) {
    setCandidateId(id);
    setScheduledDate("");
    setScheduledTime("");
  }

  function onVacancyChange(id: string) {
    setVacancyId(id);
    setScheduledDate("");
    setScheduledTime("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!interviewerId) { setError("Не удалось определить текущего пользователя"); return; }
    if (!scheduledDate || !scheduledTime) { setError("Укажите дату и время"); return; }
    if (blockedTimes.has(scheduledTime)) {
      setError("Выбранное время недоступно — занято по вакансии или у кандидата уже есть собеседование в это время");
      return;
    }
    setBusy(true); setError(null);
    try {
      const iv = await interviewsApi.create({
        candidateId, vacancyId, interviewerUserId: interviewerId,
        plan: plan || undefined,
        scheduledAt: combineDateAndTime(scheduledDate, scheduledTime).toISOString(),
      });

      const currentCandidate = candidates.find(c => c.id === candidateId);
      const candidateName = currentCandidate ? currentCandidate.fullName : "Кандидат";
      
      showToast(`Собеседование для кандидата "${candidateName}" успешно назначено.`);

      onCreated();
      return iv;
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form id="create-interview-form" className="card" onSubmit={submit}>
      <h2>Новое собеседование</h2>
      {error && <ErrorState message={error} />}
      <div className="grid-2">
        <div className="field"><label>Кандидат *</label>
          <select className="select" value={candidateId} required onChange={(e) => onCandidateChange(e.target.value)}>
            <option value="" disabled>Выберите кандидата</option>
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select></div>
        <div className="field"><label>Вакансия *</label>
          <select className="select" value={vacancyId} required onChange={(e) => onVacancyChange(e.target.value)}>
            <option value="" disabled>Выберите вакансию</option>
            {vacancies.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select></div>
      </div>
      <div className="grid-2">
        <div className="field"><label>Дата *</label>
          <DatePicker
            value={scheduledDate}
            onChange={setScheduledDate}
            required
            minDate={toLocalDateString(new Date())}
          /></div>
        <div className="field"><label>Время *</label>
          <TimeSelect
            value={scheduledTime}
            onChange={setScheduledTime}
            blockedTimes={blockedTimes}
            required
            disabled={!scheduledDate || !vacancyId || !candidateId || loadingSchedule}
          />
          {(vacancyId || candidateId) && scheduledDate && blockedTimes.size > 0 && (
            <span className="field-hint">
              Занятые слоты недоступны: конфликт по вакансии или у выбранного кандидата уже есть собеседование в этот день.
            </span>
          )}
        </div>
      </div>
      <div className="field"><label>План собеседования</label>
        <textarea className="textarea" value={plan} onChange={(e) => setPlan(e.target.value)} /></div>
    </form>
  );
}