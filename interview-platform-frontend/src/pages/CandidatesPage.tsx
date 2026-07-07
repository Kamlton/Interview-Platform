import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { candidatesApi } from "../api";
import { apiError } from "../api/client";
import type { Paged, CandidateListItem, CandidateRegistryFilters, CandidateStatus } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, StatusBadge, Pagination } from "../components/ui";
import {
  CandidateFilters, type CandidateFilterValues, type CandidateSortDate, type CandidateSortName,
} from "../components/CandidateFilters";

function filtersFromParams(params: URLSearchParams): CandidateFilterValues {
  return {
    city: params.get("city") || "",
    status: (params.get("status") || "") as CandidateStatus | "",
    sortDate: (params.get("sortDate") || "newest") as CandidateSortDate,
    sortName: (params.get("sortName") || "") as CandidateSortName,
  };
}

function paramsFromFilters(filters: CandidateFilterValues): URLSearchParams {
  const next = new URLSearchParams();
  if (filters.city) next.set("city", filters.city);
  if (filters.status) next.set("status", filters.status);
  if (filters.sortDate !== "newest") next.set("sortDate", filters.sortDate);
  if (filters.sortName) next.set("sortName", filters.sortName);
  return next;
}

function toRegistryFilters(filters: CandidateFilterValues): CandidateRegistryFilters {
  return {
    city: filters.city || undefined,
    status: filters.status || undefined,
    sortDate: filters.sortDate,
    sortName: filters.sortName || undefined,
  };
}

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Paged<CandidateListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidateFilterValues>(() => filtersFromParams(searchParams));

  const registryFilters = useMemo(() => toRegistryFilters(filters), [filters]);

  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
  }, [searchParams]);

  const applyFilters = useCallback((next: CandidateFilterValues) => {
    setPage(1);
    setFilters(next);
    setSearchParams(paramsFromFilters(next), { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    const t = setTimeout(() => {
      candidatesApi.registry(page, 20, search, false, registryFilters)
        .then((d) => active && setData(d))
        .catch((e) => active && setError(apiError(e)))
        .finally(() => active && setLoading(false));
    }, search ? 300 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [page, search, registryFilters]);

  return (
    <>
      <PageHeader title="Кандидаты">
        <button className="btn" onClick={() => navigate("/candidates/new")}>Добавить кандидата</button>
      </PageHeader>

      <div className="toolbar">
        <div className="toolbar-search">
          <input className="input search" placeholder="Поиск по ФИО или городу"
            value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <CandidateFilters filters={filters} onApply={applyFilters} />
        </div>
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
