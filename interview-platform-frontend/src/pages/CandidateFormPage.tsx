import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { candidatesApi, interviewsApi } from "../api";
import { apiError } from "../api/client";
import type { SaveCandidate, InterviewListItem } from "../types";
import { PageHeader, Spinner, ErrorState, StatusBadge } from "../components/ui";
import { useToast } from "../components/ToastContext";

const EMPTY: SaveCandidate = { fullName: "", phone: "", city: "", education: "", previousWorkplace: "", skills: [] };

export default function CandidateFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState<SaveCandidate>(EMPTY);
  const [skillsText, setSkillsText] = useState("");
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // НОВЫЙ СТЕЙТ: если это редактирование, изначально включаем режим «только чтение»
  const [isReadOnly, setIsReadOnly] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([candidatesApi.get(id), interviewsApi.registry(1, 50, "", id)])
      .then(([c, iv]) => {
        if (!active) return;
        setForm({
          fullName: c.fullName, phone: c.phone ?? "", city: c.city ?? "",
          education: c.education ?? "", previousWorkplace: c.previousWorkplace ?? "", skills: c.skills,
        });
        setSkillsText(c.skills.join(", "));
        setInterviews(iv.items);
      })
      .catch((e) => active && setError(apiError(e)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  function set<K extends keyof SaveCandidate>(k: K, v: SaveCandidate[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);

    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setError("Пожалуйста, введите полное ФИО кандидата.");
      setBusy(false);
      return;
    }

    const phoneRegex = /^(?:\+7|8)\d{10}$/;
    const cleanPhone = (form.phone ?? "").trim();

    if (!phoneRegex.test(cleanPhone)) {
      setError("Пожалуйста, введите корректный номер телефона.");
      setBusy(false);
      return;
    }

    const payload: SaveCandidate = {
      ...form,
      fullName: form.fullName.trim(),
      phone: cleanPhone,
      skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      const saved = isEdit 
        ? await candidatesApi.update(id!, payload) 
        : await candidatesApi.create(payload);
      
      if (isEdit) {
        showToast(`Данные кандидата ${payload.fullName} обновлены.`);
        setIsReadOnly(true); // После успешного сохранения возвращаем режим чтения
      } else {
        showToast(`Новый кандидат "${payload.fullName}" добавлен.`);
        navigate(`/candidates/${saved.id}`); // Перекидываем на детали созданного
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title={isEdit ? (isReadOnly ? "Информация о кандидате" : "Редактирование кандидата") : "Новый кандидат"}>
  <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
    
    {/* 1. Режим СОЗДАНИЯ нового кандидата */}
    {!isEdit && (
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Создаем…" : "Создать"}
      </button>
    )}

    {/* 2. Режим РЕДАКТИРОВАНИЯ (когда вошли в редактирование и разрешена запись) */}
    {isEdit && !isReadOnly && (
      <>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => setIsReadOnly(true)}>
          Отменить редактирование
        </button>
      </>
    )}

    {/* 3. Режим ПРОСМОТРА (когда вошли в карточку, но только для чтения) */}
    {isEdit && isReadOnly && (
      <button className="btn" type="button" onClick={() => setIsReadOnly(false)}>
        Редактировать
      </button>
    )}
    
    {/* Вертикальный разделитель (он будет всегда, так как кнопка "Назад" всегда идёт второй группой) */}
    <div style={{
      width: "1px",
      backgroundColor: "var(--border-color, #ccc)",
      alignSelf: "stretch",
      opacity: 0.6
    }} />

    {/* Кнопка возврата, которая всегда отделена палочкой */}
    <button className="btn btn-ghost" type="button" onClick={() => navigate("/candidates")}>
      Назад к кандидатам
    </button>
  </div>
</PageHeader>
      

      {error && <ErrorState message={error} />}

      <form className="card" onSubmit={onSubmit}>
          <div className="field">
            <label>ФИО *</label>
            <input className="input" value={form.fullName} required disabled={isReadOnly}
              onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="field"><label>Телефон *</label>
              <input className="input" value={form.phone} required disabled={isReadOnly} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="field"><label>Город</label>
              <input className="input" value={form.city} disabled={isReadOnly} onChange={(e) => set("city", e.target.value)} /></div>
          </div>
          <div className="field"><label>Образование</label>
            <textarea className="textarea" value={form.education} disabled={isReadOnly} onChange={(e) => set("education", e.target.value)} /></div>
          <div className="field"><label>Предыдущее место работы</label>
            <textarea className="textarea" value={form.previousWorkplace} disabled={isReadOnly}
              onChange={(e) => set("previousWorkplace", e.target.value)} /></div>
          <div className="field"><label>Навыки (через запятую)</label>
            <input className="input" value={skillsText} placeholder="C#, SQL, EF Core" disabled={isReadOnly}
              onChange={(e) => setSkillsText(e.target.value)} /></div>
        </form>

        <div>
          {isEdit && (
            <div className="card">
              <h2>Собеседования</h2>
              {interviews.length === 0 ? <div className="muted">Пока нет собеседований.</div> : (
                <table className="data">
                  <tbody>
                    {interviews.map((iv) => (
                      <tr key={iv.id} className="clickable" onClick={() => navigate(`/interviews/${iv.id}`)}>
                        <td>{iv.vacancyTitle}</td>
                        <td className="muted">{new Date(iv.scheduledAt).toLocaleDateString("ru-RU")}</td>
                        <td><StatusBadge status={iv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
    </>
  );
}