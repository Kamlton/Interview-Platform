import { useEffect, useMemo, useState } from "react";
import { auditApi, usersApi } from "../api";
import { apiError } from "../api/client";
import type { AuditLogEntry, UserDto } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState } from "../components/ui";

const KINDS: Record<string, { label: string; tone: string }> = {
  navigate: { label: "Переход", tone: "tone-blue" },
  click: { label: "Кнопка", tone: "tone-amber" },
};

// Действие хранится строкой вида "navigate:/candidates" или "click:Сохранить".
function splitAction(action: string): { kind: { label: string; tone: string }; text: string } {
  const idx = action.indexOf(":");
  const prefix = idx > 0 ? action.slice(0, idx) : "";
  const kind = KINDS[prefix];
  return kind
    ? { kind, text: action.slice(idx + 1) }
    : { kind: { label: "Другое", tone: "tone-grey" }, text: action };
}

export default function AuditPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [username, setUsername] = useState("");
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    usersApi.list()
      .then((u) => { setUsers(u); if (u.length > 0) setUsername(u[0].email); })
      .catch((e) => setError(apiError(e)));
  }, []);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setBusy(true); setError(null);
    auditApi.userHistory(username)
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch((e) => { if (!cancelled) setError(apiError(e)); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [username]);

  async function refresh() {
    if (!username) return;
    setBusy(true); setError(null);
    try { setEntries(await auditApi.userHistory(username)); }
    catch (e) { setError(apiError(e)); }
    finally { setBusy(false); }
  }

  // Журнал пишется в хронологическом порядке — показываем свежие сверху.
  const filtered = useMemo(() => {
    if (!entries) return null;
    const list = [...entries].reverse();
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((e) => e.action.toLowerCase().includes(q));
  }, [entries, search]);

  return (
    <>
      <PageHeader title="Аудит действий">
        <button className="btn btn-ghost" onClick={refresh} disabled={busy || !username}>
          {busy ? "Обновляем…" : "Обновить"}
        </button>
      </PageHeader>

      {error && <ErrorState message={error} />}

      <div className="toolbar">
        <select className="select search" value={username}
          onChange={(e) => setUsername(e.target.value)} disabled={!users}>
          {!users && <option value="">Загрузка пользователей…</option>}
          {users?.map((u) => (
            <option key={u.id} value={u.email}>{u.fullName} — {u.email}</option>
          ))}
        </select>
        <input className="input search" placeholder="Поиск по действию…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="panel table-wrap">
        {!filtered ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState title="Записей нет"
            hint={search ? "Ничего не найдено по вашему запросу" : "Пользователь ещё не совершал действий"} />
        ) : (
          <table className="data">
            <thead>
              <tr><th>Время</th><th>Тип</th><th>Действие</th><th>Роль</th></tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const { kind, text } = splitAction(e.action);
                return (
                  <tr key={i}>
                    <td className="muted">{new Date(e.time).toLocaleString("ru-RU")}</td>
                    <td><span className={"badge " + kind.tone}>{kind.label}</span></td>
                    <td>{text}</td>
                    <td><span className="chip">{e.role}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
