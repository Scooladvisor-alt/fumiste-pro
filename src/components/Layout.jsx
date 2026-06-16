import { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Flame, Settings } from "lucide-react";
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
    <div className="min-h-screen bg-secondary/40 flex flex-col md:flex-row font-body">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border px-4 py-6 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-extrabold text-[15px] leading-tight text-foreground">Fumiste Pro</p>
            <p className="text-xs text-muted-foreground">Gestion artisan</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(to)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => base44.auth.logout()}
          className="mt-auto text-xs text-muted-foreground hover:text-foreground text-left px-3 py-2"
        >
          Se déconnecter
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center gap-2.5 px-4 h-14 bg-card border-b border-border sticky top-0 z-20">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Flame className="w-4 h-4 text-primary-foreground" />
        </div>
        <p className="font-display font-extrabold text-foreground">Fumiste Pro</p>
      </header>

      {/* Content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-border flex">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              isActive(to) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}