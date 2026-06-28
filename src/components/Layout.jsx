import { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Flame, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureInterventionTypes } from "@/lib/seed";
import { base44 } from "@/api/base44Client";
import AutoSendEmails from "@/components/AutoSendEmails";

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
      <AutoSendEmails />
      {/* Barre supérieure braise (desktop) — pleine largeur pour laisser plus d'espace au contenu */}
      <header className="hidden lg:flex shrink-0 bg-[#1c1410] text-white/90 relative overflow-hidden items-center px-6 h-16">
        {/* lueur de braise */}
        <div className="pointer-events-none absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-gradient-to-t from-ember-glow/30 via-ember/15 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -top-10 right-0 w-40 h-40 rounded-full bg-ember/10 blur-2xl" />

        <div className="relative flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ember-glow via-ember to-ember-deep flex items-center justify-center shadow-lg shadow-ember/40">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-display font-extrabold text-base tracking-tight text-white">Fumiste Pro</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ember-glow/80 font-semibold">Gestion ramonage</p>
          </div>
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
                    : "text-white/55 hover:text-white hover:bg-white/5"
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
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Se déconnecter
        </button>
      </header>

      {/* Mobile top bar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden shrink-0 bg-[#1c1410] text-white sticky top-0 z-20">
          <div className="flex items-center gap-3 px-4 h-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ember-glow via-ember to-ember-deep flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="font-display font-extrabold text-base tracking-tight flex-1">Fumiste Pro</p>
            <button onClick={() => base44.auth.logout()} className="text-white/60 hover:text-white p-2">
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
                    active ? "bg-gradient-to-r from-ember to-ember-deep text-white" : "text-white/55"
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