import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import AuditTracker from "../audit/AuditTracker";
import type { Role } from "../types";
import logoImg from "../img/logotype.png";

interface NavItem { to: string; label: string; roles?: Role[]; }

const NAV: NavItem[] = [
  { to: "/interviews", label: "Собеседования" },
  { to: "/candidates", label: "Кандидаты", roles: ["Администратор", "Отдел кадров"] },
  { to: "/vacancies", label: "Вакансии", roles: ["Администратор", "Отдел кадров"] },
  { to: "/users", label: "Пользователи", roles: ["Администратор"] },
  { to: "/audit", label: "Аудит", roles: ["Администратор"] },
  { to: "/archive", label: "Архив", roles: ["Администратор", "Отдел кадров"] },
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
    {dateTime.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })}
    {"\u00a0\u00a0|\u00a0\u00a0"} 
    {dateTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
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
        <div className="brand" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <img 
            src={logoImg} 
            alt="Логотип ИС Собеседования" 
            style={{ maxWidth: "100%", height: "auto", display: "block" }} 
          />
        </div>
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
          <div className="foot-actions-row">
            <NavLink to="/change-password" className="btn btn-ghost btn-sm btn-foot">
              Сменить пароль
            </NavLink>
            <button className="btn btn-ghost btn-sm btn-foot" onClick={() => { logout(); navigate("/login"); }}>
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