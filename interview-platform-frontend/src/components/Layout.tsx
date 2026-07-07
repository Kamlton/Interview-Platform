import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; // <-- ДОБАВЬТЕ
import { useAuth } from "../auth/AuthContext";
import AuditTracker from "../audit/AuditTracker";
import type { Role } from "../types";

interface NavItem { to: string; label: string; roles?: Role[]; }

const NAV: NavItem[] = [
  { to: "/candidates", label: "Кандидаты", roles: ["Администратор", "Отдел кадров"] },
  { to: "/interviews", label: "Собеседования" },
  { to: "/vacancies", label: "Вакансии", roles: ["Администратор", "Отдел кадров"] },
  { to: "/users", label: "Пользователи", roles: ["Администратор"] },
  { to: "/audit", label: "Аудит", roles: ["Администратор"] },
];

function CurrentDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="current-datetime">
      <div className="datetime-date">
        {dateTime.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </div>
      <div className="datetime-time">
        {dateTime.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
    </div>
  );
}

export default function Layout() {
  const { fullName, role, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter((i) => !i.roles || (role && i.roles.includes(role)));

  return (
    <div className="app">
      <AuditTracker />
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">ИС</span>
          <span className="brand-text">Собеседования</span>
        </div>
        {/* <-- ДОБАВЛЯЕМ ДАТУ И ВРЕМЯ ПОД БРЕНДОМ --> */}
        <CurrentDateTime />
        <nav className="nav">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user">
            <div className="user-name">{fullName}</div>
            <div className="user-role">{role}</div>
          </div>
          <div className="foot-actions">
            <NavLink to="/change-password" className="link-sm">Сменить пароль</NavLink>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate("/login"); }}>
              Выйти
            </button>
          </div>
        </div>
      </aside>
      <main className="content">
        <Outlet context={{ hasRole }} />
      </main>
    </div>
  );
}