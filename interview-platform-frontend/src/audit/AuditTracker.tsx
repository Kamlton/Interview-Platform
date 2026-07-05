import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { auditApi } from "../api";
import { tokenStore } from "../api/client";

// Отправка "в одну сторону": сбой аудита не должен мешать работе пользователя.
function track(action: string) {
  if (!tokenStore.get()) return; // мониторим только авторизованных
  auditApi.logAction(action).catch(() => {});
}

/**
 * Невидимый компонент-монитор. Живёт внутри Layout (защищённой зоны),
 * поэтому события отправляются только для авторизованного пользователя:
 * - переход по страницам  -> "navigate:<путь>"
 * - нажатие любой кнопки  -> "click:<название кнопки>"
 */
export default function AuditTracker() {
  const { pathname } = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    track(`navigate:${pathname}`);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest?.("button, [role='button']");
      if (!el) return;
      const label = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 80);
      track(`click:${label || "<без названия>"}`);
    }
    // capture-фаза: событие фиксируется, даже если обработчик кнопки остановит всплытие
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
