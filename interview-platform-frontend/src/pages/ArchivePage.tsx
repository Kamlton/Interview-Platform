import { useEffect, useState } from "react";
import { archiveApi } from "../api";
import { apiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Paged, ArchiveItem, ArchiveType } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, Pagination } from "../components/ui";

type SortKey = "date" | "title" | "type";
const TYPES: { value: string; label: string }[] = [
  { value: "All", label: "Все" },
  { value: "Candidate", label: "Кандидаты" },
  { value: "Vacancy", label: "Вакансии" },
  { value: "Interview", label: "Собеседования" },
];

export default function ArchivePage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("Администратор");

  const [data, setData] = useState<Paged<ArchiveItem> | null>(null);
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    const t = setTimeout(() => {
      archiveApi.list({ type, search, sort, dir, page, size: 20 })
        .then((d) => active && setData(d))
        .catch((e) => active && setError(apiError(e)))
        .finally(() => active && setLoading(false));
    }, search ? 300 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [type, search, sort, dir, page, reload]);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(key); setDir("asc"); }
    setPage(1);
  }
  const arrow = (key: SortKey) => (sort === key ? (dir === "asc" ? " ↑" : " ↓") : "");

  async function restore(item: ArchiveItem) {
    try { await archiveApi.restore(item.type as ArchiveType, item.id); setReload((x) => x + 1); }
    catch (e) { setError(apiError(e)); }
  }
  async function remove(item: ArchiveItem) {
    if (!confirm(`Удалить безвозвратно: «${item.title}»?`)) return;
    try { await archiveApi.remove(item.type as ArchiveType, item.id); setReload((x) => x + 1); }
    catch (e) { setError(apiError(e)); }
  }

  return (
    <>
      <PageHeader title="Архив" />

      <div className="toolbar">
        <select className="select" style={{ maxWidth: 200 }} value={type}
          onChange={(e) => { setPage(1); setType(e.target.value); }}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input className="input search" placeholder="Поиск по названию"
          value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>

      <div className="panel table-wrap">
        {loading ? <Spinner /> : error ? <ErrorState message={error} /> :
          !data || data.items.length === 0 ? (
            <EmptyState title="Архив пуст" hint="Перенесите запись в архив со страниц кандидатов, вакансий или собеседований." />
          ) : (
            <table className="data">
              <thead>
                <tr>
                    <th className="sortable" onClick={() => toggleSort("title")}>Название{arrow("title")}</th>
                    <th className="sortable" onClick={() => toggleSort("type")}>Тип{arrow("type")}</th>
                    <th>Доп.</th>
                    <th className="sortable" onClick={() => toggleSort("date")}>Создано{arrow("date")}</th>
                    {isAdmin && <th style={{ width: 1 }}>Действия</th>}
                </tr>
                </thead>
              <tbody>
                {data.items.map((it) => (
                  <tr key={`${it.type}-${it.id}`}>
                    <td>{it.title}</td>
                    <td><span className="chip">{it.typeLabel}</span></td>
                    <td className="muted">{it.subtitle || "—"}</td>
                    <td className="muted">{new Date(it.createdAt).toLocaleDateString("ru-RU")}</td>
                    {isAdmin && (
                        <td>
                        <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => restore(it)}>Вернуть</button>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(it)}>Удалить</button>
                        </div>
                        </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      {!isAdmin && <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        Восстановление и удаление доступны только администратору.
      </p>}
    </>
  );
}
