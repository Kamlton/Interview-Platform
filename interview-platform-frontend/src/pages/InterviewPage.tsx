import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { interviewsApi, vacanciesApi } from "../api";
import { api, apiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastContext"; 
import type { InterviewDetails, Competency, Protocol, DecisionType, DocumentType } from "../types";
import { PageHeader, Spinner, ErrorState, StatusBadge } from "../components/ui";
import { RadarChart } from "../components/RadarChart";

interface Row { competencyId: string; name: string; score: number | ""; comment: string; }

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast(); // Инициализируем тосты
  const canScore = hasRole("Администратор", "Отдел кадров");
  const canDecide = hasRole("Администратор", "Решала");

  const [details, setDetails] = useState<InterviewDetails | null>(null);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [d, proto] = await Promise.all([
        interviewsApi.get(id), 
        interviewsApi.protocol(id),
      ]);

      setDetails(d);
      setProtocol(proto);
      setSummary(proto.summary ?? "");

      const comps = await vacanciesApi.getCompetencies(d.vacancyId);
      const byComp = new Map(proto.scores.map((s) => [s.competencyId, s]));
      setRows(comps.map((c: Competency) => ({
        competencyId: c.id, 
        name: c.name,
        score: byComp.get(c.id)?.score ?? "",
        comment: byComp.get(c.id)?.comment ?? "",
      })));
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function saveScores() {
    if (!id) return;
    const scores = rows.filter((r) => r.score !== "")
      .map((r) => ({ competencyId: r.competencyId, score: Number(r.score), comment: r.comment || undefined }));
    try {
      await interviewsApi.saveScores(id, scores, summary || undefined);
      
      // Заменяем локальный стейт сообщений глобальным тостом
      showToast("Изменения успешно сохранены.");
      
      await load();
    } catch (e) { setError(apiError(e)); }
  }

  async function decide(type: DecisionType) {
    if (!id) return;
    try { 
      await interviewsApi.decide(id, type); 
      
      // Локализация сообщения для тоста в зависимости от решения
      const decisionLabels: Record<DecisionType, string> = {
        Offer: "Выставлен оффер",
        Reject: "Оформлен отказ",
        Hold: "Собеседование отложено"
      };
      showToast(`Решение принято: ${decisionLabels[type] || type}.`);
      
      await load(); 
    } catch (e) { setError(apiError(e)); }
  }

  async function download(type: DocumentType) {
    if (!id) return;
    try {
      const res = await api.get(interviewsApi.printUrl(id, type), { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `${type}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(apiError(e)); }
  }

  if (loading) return <Spinner />;
  if (error && !details) return <ErrorState message={error} />;
  if (!details) return null;

  return (
    <>
      <PageHeader title="Собеседование">
  <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
    {canScore && (
      <>
        <button className="btn" type="button" onClick={saveScores}>
          Сохранить оценки компетенций
        </button>

        {/* Вертикальный разделитель — рендерится только при наличии кнопки сохранения */}
        <div style={{
          width: "1px",
          backgroundColor: "var(--border-color, #ccc)",
          alignSelf: "stretch",
          opacity: 0.6
        }} />
      </>
    )}

    <button className="btn btn-ghost" type="button" onClick={() => navigate("/interviews")}>
      Назад к собеседованиям
    </button>
  </div>
</PageHeader>

      {error && <ErrorState message={error} />}

      <div className="cols">
        {/* ЛЕВЫЙ СТОЛБЕЦ — Оценки и печатные формы */}
        <div>
          <div className="card">
            <h2>Оценка компетенций</h2>
            {rows.length === 0 ? <div className="muted">Каталог компетенций пуст.</div> : (
              <table className="data">
                <thead><tr><th>Компетенция</th><th style={{ width: 90 }}>Балл</th><th>Комментарий</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.competencyId}>
                      <td>{r.name}</td>
                      <td>
                        <input className="input score-input" type="number" min={1} max={10} disabled={!canScore}
                          value={r.score}
                          onChange={(e) => {
                            const v = e.target.value === "" ? "" : Math.max(1, Math.min(10, Number(e.target.value)));
                            setRows((rs) => rs.map((x, j) => j === i ? { ...x, score: v } : x));
                          }} />
                      </td>
                      <td>
                        <input className="input" disabled={!canScore} value={r.comment}
                          onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, comment: e.target.value } : x))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="field" style={{ marginTop: 14 }}>
              <label>Заключение</label>
              <textarea className="textarea" value={summary} disabled={!canScore}
                onChange={(e) => setSummary(e.target.value)} />
            </div>
          </div>

          <div className="card" style={{ marginTop: "var(--gap)" }}>
            <h2>Печатные формы</h2>
            <div className="btn-row">
              <button className="btn btn-ghost btn-sm" onClick={() => download("InterviewProtocol")}>Протокол (PDF)</button>
              <button className="btn btn-ghost btn-sm" onClick={() => download("OfferLetter")}>Оффер (PDF)</button>
              <button className="btn btn-ghost btn-sm" onClick={() => download("RejectionLetter")}>Отказ (PDF)</button>
            </div>
          </div>
        </div>

        {/* ПРАВЫЙ СТОЛБЕЦ — Данные и решение */}
        <div>
          <div className="card">
            <h2>Данные</h2>
            <dl className="kv">
              <dt>Кандидат</dt><dd>{details.candidateName}</dd>
              <dt>Вакансия</dt><dd>{details.vacancyTitle}</dd>
              <dt>Интервьюер</dt><dd>{details.interviewerName}</dd>
              <dt>Дата</dt><dd>{new Date(details.scheduledAt).toLocaleString("ru-RU")}</dd>
              <dt>Статус</dt><dd><StatusBadge status={details.status} /></dd>
              <dt>Средний балл</dt><dd>{protocol?.averageScore ?? 0}</dd>
              <dt>Решение</dt><dd>{protocol?.decision ? <StatusBadge status={protocol.decision === "Offer" ? "Hired" : protocol.decision === "Reject" ? "Rejected" : "InProgress"} /> : "—"}</dd>
            </dl>
          </div>

          {canDecide && !protocol?.decision && (
            <div className="card">
              <h2>Решение</h2>
              <div className="btn-row">
                <button className="btn btn-green" onClick={() => decide("Offer")}>Оффер</button>
                <button className="btn btn-danger" onClick={() => decide("Reject")}>Отказ</button>
                <button className="btn btn-ghost" onClick={() => decide("Hold")}>Отложить</button>
              </div>
            </div>
          )}

          {/* Радар-график с оценками */}
          {protocol && protocol.scores && protocol.scores.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--gap)' }}>
              <h2>Визуализация оценок</h2>
              <RadarChart
                scores={protocol.scores.map((s) => ({
                  competency: s.competencyName,
                  score: s.score,
                }))}
                maxScore={10}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}