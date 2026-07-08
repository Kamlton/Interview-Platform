import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auditApi, usersApi } from "../api";
import { apiError } from "../api/client";
import type { AuditLogEntry, UserDto } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState } from "../components/ui";

// Бизнес-события с бэкенда — готовый читаемый текст.
// Старые записи прежнего формата ("navigate:"/"click:") показываем как есть.
function describeAction(action: string): string {
  return action;
}

export default function AuditPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [userFilter, setUserFilter] = useState("");   // email или "" = все
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Справочник email -> ФИО, чтобы в журнале показывать имя, а не логин.
  const nameByEmail = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => map.set(u.email, u.fullName));
    return map;
  }, [users]);

  async function load() {
    setBusy(true); setError(null);
    try { setEntries(await auditApi.allActions()); }
    catch (e) { setError(apiError(e)); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    usersApi.list().then(setUsers).catch(() => {});
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!entries) return null;
    const q = search.toLowerCase().trim();
    return entries.filter((e) => {
      if (userFilter && e.username !== userFilter) return false;
      if (q && !describeAction(e.action).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, userFilter, search]);

  return (
    <>
      <PageHeader title="Журнал аудита">
        <button className="btn btn-ghost" onClick={load} disabled={busy}>
          {busy ? "Обновляем…" : "Обновить"}
        </button>
      </PageHeader>

      {error && <ErrorState message={error} />}

      <div className="toolbar">
        <select className="select search" value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}>
          <option value="">Все пользователи</option>
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
            hint={search || userFilter ? "Ничего не найдено по фильтру" : "Действий пока не зафиксировано"} />
        ) : (
          <table className="data">
            <thead>
              <tr><th>Кто</th><th>Действие</th><th>Раздел</th><th>Время</th></tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={i}>
                  <td>
                    <div>{nameByEmail.get(e.username) || e.username}</div>
                    <span className="chip">{e.role}</span>
                  </td>
                  <td>{describeAction(e.action)}</td>
                  <td>
                    {e.link
                      ? <Link className="btn btn-ghost btn-sm" to={e.link}>Перейти</Link>
                      : <span className="muted">—</span>}
                  </td>
                  <td className="muted">{new Date(e.time).toLocaleString("ru-RU")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
