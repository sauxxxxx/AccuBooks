import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const COLLAPSED_STORAGE_KEY = "accubooks.sidebarCollapsed";

export function AppShell() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return stored ? stored === "true" : true;
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div
        className={`app-shell__backdrop ${mobileNavOpen ? "app-shell__backdrop--visible" : ""}`}
        aria-hidden="true"
        onClick={() => setMobileNavOpen(false)}
      />

      <main className="app-shell__main">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <div className="app-shell__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
