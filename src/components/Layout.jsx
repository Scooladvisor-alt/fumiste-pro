import { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureInterventionTypes } from "@/lib/seed";
import { base44 } from "@/api/base44Client";

const NAV = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard },
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
    to === "/app" ? location.pathname === "/app" : location.pathname.startsWith(to);

  return (
    <div className="h-screen flex flex-col font-body bg-[#fbf7f4]">
      {/* Barre supérieure claire (desktop) — pleine largeur pour laisser plus d'espace au contenu */}
      <header className="hidden lg:flex shrink-0 bg-card text-foreground border-b border-border relative items-center px-6 h-16">
        <div className="relative flex items-center pr-6">
          <p className="font-display font-extrabold text-lg tracking-tight text-foreground">Fumiste Pro</p>
        </div>

        <nav className="relative flex items-center gap-1 flex-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-ember to-ember-deep text-white shadow-lg shadow-ember/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className={cn("w-[18px] h-[18px] transition-transform", !active && "group-hover:scale-110")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => base44.auth.logout()}
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Se déconnecter
        </button>
      </header>

      {/* Mobile top bar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden shrink-0 bg-card text-foreground border-b border-border sticky top-0 z-20">
          <div className="flex items-center gap-3 px-4 h-16">
            <p className="font-display font-extrabold text-lg tracking-tight flex-1">Fumiste Pro</p>
            <button onClick={() => base44.auth.logout()} className="text-muted-foreground hover:text-foreground p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex items-center gap-1 px-2 pb-2 overflow-x-auto no-scrollbar">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    active ? "bg-gradient-to-r from-ember to-ember-deep text-white" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="hidden xs:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 min-h-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}