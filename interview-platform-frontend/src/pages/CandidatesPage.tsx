import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { candidatesApi } from "../api";
import { apiError } from "../api/client";
import type { Paged, CandidateListItem } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, StatusBadge, Pagination } from "../components/ui";

type SortField = "fullName" | "city" | "status";
type SortOrder = "asc" | "desc" | null;
const STATUS_RU: Record<string, string> = {
  New: "Новый", 
  InProgress: "Отложен", 
  Hired: "Оффер", 
  Rejected: "Отказ",
};

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paged<CandidateListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Сортировка
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Состояния фильтрации
  const [isFilterModeActive, setIsFilterModeActive] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"city" | "status" | null>(null);

  // Временные выбранные значения (до нажатия ОК)
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Примененные фильтры, по которым рендерится таблица
  const [appliedCities, setAppliedCities] = useState<string[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); 
    setError(null);
    const t = setTimeout(() => {
      candidatesApi.registry(page, 20, search, false)
        .then((d) => active && setData(d))
        .catch((e) => active && setError(apiError(e)))
        .finally(() => active && setLoading(false));
    }, search ? 300 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [page, search, reload]);

  // Закрытие выпадающего меню при клике вне его области
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Получение списка уникальных значений для фильтров
  const getUniqueValues = (field: "city" | "status"): string[] => {
    if (!data?.items) return [];
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

  const handleToggleCity = (city: string) => {
    setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  };

  const handleToggleStatus = (status: string) => {
    setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const applyCityFilter = () => {
    setAppliedCities(selectedCities);
    setActiveDropdown(null);
  };

  const applyStatusFilter = () => {
    setAppliedStatuses(selectedStatuses);
    setActiveDropdown(null);
  };

  async function handleArchive(id: string, archived: boolean) {
  if (!confirm(`Отправить кандидата в архив?`)) return;
  try {
    await candidatesApi.archive(id, archived);
    // Обновляем данные (перезагружаем страницу)
    setReload((x) => x + 1);
  } catch (e) {
    setError(apiError(e));
  }
}

  // Комбинированная обработка данных: сначала фильтрация, затем сортировка
  const getFilteredAndSortedItems = (): CandidateListItem[] => {
    if (!data?.items) return [];
    let result = [...data.items];

    // Применение фильтров, если режим активен
    if (isFilterModeActive) {
      if (appliedCities.length > 0) result = result.filter(item => appliedCities.includes(item.city || "—"));
      if (appliedStatuses.length > 0) result = result.filter(item => appliedStatuses.includes(item.status));
    }

    // Применение сортировки
    if (!sortField || !sortOrder) return result;

    return result.sort((a, b) => {
      let valA = (a[sortField] || "").toLowerCase();
      let valB = (b[sortField] || "").toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const processedItems = getFilteredAndSortedItems();
  const isCityFilterApplied = appliedCities.length > 0;
  const isStatusFilterApplied = appliedStatuses.length > 0;

  return (
    <>
      <PageHeader title="Кандидаты">
        <button className="btn" onClick={() => navigate("/candidates/new")}>Добавить кандидата</button>
      </PageHeader>

      <div className="toolbar filter-toolbar">
        <input className="input search" placeholder="Поиск по ФИО или городу"
          value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        
        <button
          type="button"
          className={`btn ${isFilterModeActive ? "btn-primary" : "btn-ghost"}`}
          onClick={() => {
            if (isFilterModeActive) {
              setSelectedCities([]);
              setSelectedStatuses([]);
              setAppliedCities([]);
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

      {/* Класс dropdown-visible отключает overflow: auto у таблицы, позволяя меню выходить за границы */}
      <div className={`panel table-wrap ${activeDropdown ? "dropdown-visible" : ""}`}>
        {loading ? <Spinner /> : error ? <ErrorState message={error} /> :
          !data || processedItems.length === 0 ? (
            <EmptyState title="Кандидатов не найдено" hint="Измените запрос или добавьте нового кандидата." />
          ) : (
            <table className="data candidate-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => handleSort("fullName")}>
                    ФИО {renderSortIcon("fullName")}
                  </th>
                  
                  <th className={`filterable-th ${isFilterModeActive ? "with-padding" : ""}`}>
                    <span className="th-label" onClick={() => handleSort("city")}>
                      Город {renderSortIcon("city")}
                    </span>
                    {isFilterModeActive && (
                      <span
                        className={`filter-trigger-btn ${isCityFilterApplied ? "filter-active" : ""}`}
                        onClick={() => setActiveDropdown(activeDropdown === "city" ? null : "city")}
                      >
                        ⌄
                      </span>
                    )}

                    {activeDropdown === "city" && (
                      <div ref={dropdownRef} className="filter-dropdown-menu">
                        <div className="filter-dropdown-scroll">
                          {getUniqueValues("city").map(city => (
                            <label key={city} className="filter-dropdown-item">
                              <input type="checkbox" checked={selectedCities.includes(city)} onChange={() => handleToggleCity(city)} />
                              {city}
                            </label>
                          ))}
                        </div>
                        <button className="btn filter-apply-btn" onClick={applyCityFilter}>OK</button>
                      </div>
                    )}
                  </th>
                  
                  <th className={`filterable-th ${isFilterModeActive ? "with-padding" : ""}`}>
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
                          {getUniqueValues("status").map(status => (
                            <label key={status} className="filter-dropdown-item">
                              <input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => handleToggleStatus(status)} />
                              {STATUS_RU[status] || status} {/* <- Теперь здесь красивый русский текст */}
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
                {processedItems.map((c) => (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/candidates/${c.id}`)}>
                    <td>{c.fullName}</td>
                    <td className="muted">{c.city || "—"}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(c.id, true);
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