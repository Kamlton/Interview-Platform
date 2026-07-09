import { useEffect, useState, type FormEvent } from "react";
import { usersApi } from "../api";
import { apiError } from "../api/client";
import type { UserDto, Role } from "../types";
// Убрали StatusBadge из импортов, так как он больше не нужен
import { PageHeader, Spinner, EmptyState } from "../components/ui";

const ROLES: Role[] = ["Администратор", "Отдел кадров", "Решала"];

export default function UsersPage() {
  const [items, setItems] = useState<UserDto[] | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Отдел кадров");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setItems(await usersApi.list()); } catch (e) { setError(apiError(e)); }
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    
    const passwordRegex = /^(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }
    const fullNameParts = fullName.trim().split(/\s+/);
    if (fullNameParts.length < 2) {
      setError("Введите полное ФИО.");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Введите корректный E-mail.");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов.");
      return;
    }
    if (!passwordRegex.test(password)) {
      setError("Пароль слишком простой. Нужны заглавные и строчные буквы, цифры и спецсимволы.");
      return;
    }
    setBusy(true); 
    setError(null);
    try {
      await usersApi.create({ fullName, email, password, role });
      setFullName(""); 
      setEmail(""); 
      setPassword(""); 
      await load();
    } catch (err) { 
      setError(apiError(err)); 
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <>
      <PageHeader title="Пользователи" />
        <div className="cols">
          <div className="panel table-wrap">
            {!items ? <Spinner /> : items.length === 0 ? <EmptyState title="Пользователей нет" /> : (
              <table className="data">
                {/* Убрали <th>Статус</th> */}
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>E-mail</th>
                    <th>Роль</th>
                  </tr>
                </thead>
                {/* Убрали <td> с компонентом StatusBadge */}
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td className="muted">{u.email}</td>
                      <td><span className="chip">{u.role}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
        <form className="card" onSubmit={add} noValidate>
          <h2>Новый пользователь</h2>
          {error && (
            <div className="state error" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}
          <div className="field"><label>ФИО *</label>
            <input className="input" value={fullName} required 
              onChange={(e) => { setFullName(e.target.value); if (error) setError(null); }} /></div>
          <div className="field"><label>E-mail *</label>
            <input className="input" type="text" value={email} required onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label>Пароль *</label>
            <input className="input" type="password" value={password} required minLength={6}
              onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="field"><label>Роль *</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select></div>
          <div className="btn-row"><button className="btn" disabled={busy}>{busy ? "Создаём…" : "Добавить"}</button></div>
        </form>
      </div>
    </>
  );
}