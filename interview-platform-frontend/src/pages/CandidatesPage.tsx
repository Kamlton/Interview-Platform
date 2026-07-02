import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { candidatesApi } from "../api";
import { apiError } from "../api/client";
import type { Paged, CandidateListItem } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, StatusBadge, Pagination } from "../components/ui";

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paged<CandidateListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    const t = setTimeout(() => {
      candidatesApi.registry(page, 20, search, false)
        .then((d) => active && setData(d))
        .catch((e) => active && setError(apiError(e)))
        .finally(() => active && setLoading(false));
    }, search ? 300 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [page, search]);

  return (
    <>
      <PageHeader title="Кандидаты">
        <button className="btn" onClick={() => navigate("/candidates/new")}>Добавить кандидата</button>
      </PageHeader>

      <div className="toolbar">
        <input className="input search" placeholder="Поиск по ФИО или городу"
          value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>

      <div className="panel table-wrap">
        {loading ? <Spinner /> : error ? <ErrorState message={error} /> :
          !data || data.items.length === 0 ? (
            <EmptyState title="Кандидатов не найдено" hint="Измените запрос или добавьте нового кандидата." />
          ) : (
            <table className="data">
              <thead>
                <tr><th>ФИО</th><th>Город</th><th>Статус</th></tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/candidates/${c.id}`)}>
                    <td>{c.fullName}</td>
                    <td className="muted">{c.city || "—"}</td>
                    <td><StatusBadge status={c.status} /></td>
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
