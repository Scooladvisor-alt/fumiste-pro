import { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Flame, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureInterventionTypes } from "@/lib/seed";
import { base44 } from "@/api/base44Client";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/parametres", label: "Réglages", icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    ensureInterventionTypes();
  }, []);

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="h-screen bg-secondary/40 flex flex-col font-body">
      {/* Top bar */}
      <header className="shrink-0 bg-card/80 backdrop-blur-md border-b border-border/70 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-16 max-w-[120rem] mx-auto w-full">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/20">
              <Flame className="w-[18px] h-[18px] text-primary-foreground" />
            </div>
            <p className="font-display font-extrabold text-base text-foreground tracking-tight hidden sm:block">Fumiste Pro</p>
          </Link>

          <nav className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => base44.auth.logout()}
            className="shrink-0 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg px-3 py-2 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Se déconnecter</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}