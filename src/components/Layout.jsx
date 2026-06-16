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
      <header className="shrink-0 bg-card border-b border-border sticky top-0 z-20">
        <div className="flex items-center gap-4 px-4 h-14">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="font-display font-extrabold text-[15px] text-foreground hidden sm:block">Fumiste Pro</p>
          </Link>

          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive(to)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <button
            onClick={() => base44.auth.logout()}
            className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5"
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