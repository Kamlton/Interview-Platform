import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { interviewsApi, candidatesApi, vacanciesApi } from "../api";
import { apiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Paged, InterviewListItem, CandidateListItem, Vacancy } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, StatusBadge, Pagination } from "../components/ui";
import { DatePicker } from "../components/DatePicker";
import { TimeSelect } from "../components/TimeSelect";
import {
  combineDateAndTime, getBlockedTimesForDate, getScheduledTimesForDate, toLocalDateString,
} from "../utils/interviewSchedule";

export default function InterviewsPage() {
  const navigate = useNavigate();
  const { hasRole, userId } = useAuth();
  const canCreate = hasRole("Администратор", "Отдел кадров");

  const [data, setData] = useState<Paged<InterviewListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);

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

  return (
    <>
      <PageHeader title="Собеседования">
        {canCreate && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Скрыть форму" : "Назначить собеседование"}
          </button>
        )}
      </PageHeader>

      {showForm && canCreate && (
        <CreateInterview interviewerId={userId} onCreated={() => { setShowForm(false); setReload((x) => x + 1); }} />
      )}

      <div className="toolbar">
        <input className="input search" placeholder="Поиск по кандидату или вакансии"
          value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>

      <div className="panel table-wrap">
        {loading ? <Spinner /> : error ? <ErrorState message={error} /> :
          !data || data.items.length === 0 ? (
            <EmptyState title="Собеседований не найдено" hint="Назначьте новое собеседование." />
          ) : (
            <table className="data">
              <thead>
                <tr><th>Кандидат</th><th>Вакансия</th><th>Интервьюер</th><th>Дата</th><th>Статус</th></tr>
              </thead>
              <tbody>
                {data.items.map((iv) => (
                  <tr key={iv.id} className="clickable" onClick={() => navigate(`/interviews/${iv.id}`)}>
                    <td>{iv.candidateName}</td>
                    <td>{iv.vacancyTitle}</td>
                    <td className="muted">{iv.interviewerName}</td>
                    <td className="muted">{new Date(iv.scheduledAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td><StatusBadge status={iv.status} /></td>
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

function CreateInterview({ interviewerId, onCreated }:
  { interviewerId: string | null; onCreated: () => void }) {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [vacancyId, setVacancyId] = useState("");
  const [plan, setPlan] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [vacancyInterviews, setVacancyInterviews] = useState<string[]>([]);
  const [candidateInterviews, setCandidateInterviews] = useState<string[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [busy, setBusy] = useState(false);
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
  }, [vacancyId, candidateId]);

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
      onCreated();
      return iv;
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
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
      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy || loadingSchedule}>{busy ? "Создаём…" : "Создать"}</button>
      </div>
    </form>
  );
}
