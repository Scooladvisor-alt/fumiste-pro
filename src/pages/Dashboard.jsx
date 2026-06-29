import { useMemo, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, BarChart3, CalendarClock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useClients, useAppointments, useCommunicationLogs } from "@/hooks/useData";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import CommunicationStats from "@/components/dashboard/CommunicationStats";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";

export default function Dashboard() {
  const { data: clients } = useClients();
  const { data: appointments } = useAppointments();
  const { data: logs } = useCommunicationLogs();
  const [companyName, setCompanyName] = useState("");
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    base44.entities.ReminderSettings.list()
      .then((list) => setCompanyName(list[0]?.company_name || ""))
      .catch(() => {});
  }, []);

  const { counts, total } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const from =
      period === "today" ? today : subDays(new Date(), Number(period)).toISOString().slice(0, 10);

    const filtered = logs.filter((l) => l.sent_date && l.sent_date >= from && l.sent_date <= today);
    const c = {};
    filtered.forEach((l) => {
      c[l.type] = (c[l.type] || 0) + 1;
    });
    return { counts: c, total: filtered.length };
  }, [logs, period]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Bandeau braise */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ember-deep via-ember to-ember-glow p-6 md:p-7 mb-6 shadow-xl shadow-ember/25">
        <div className="pointer-events-none absolute -right-8 -top-10 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/80 text-sm font-medium capitalize">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white mt-1">
              Bonjour{companyName ? ` ${companyName}` : ""} 🔥
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/15 backdrop-blur-sm text-white rounded-xl px-3.5 py-2.5 border border-white/20">
            <Users className="w-4 h-4" />
            <span className="font-bold text-base">{clients.length}</span>
            <span className="text-white/80">clients</span>
          </div>
        </div>
      </div>

      {/* Section : suivi des communications */}
      <section className="mb-8">
        <div className="flex items-end justify-between gap-3 mb-3 flex-wrap px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BarChart3 className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-tight">Tour de contrôle</h2>
              <p className="text-xs text-muted-foreground">Vos communications automatiques en un coup d'œil.</p>
            </div>
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
        <CommunicationStats counts={counts} total={total} />
      </section>

      {/* Section : prochains rendez-vous */}
      <section>
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarClock className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">Votre journée</h2>
            <p className="text-xs text-muted-foreground">Les interventions à venir, prêtes à être appelées.</p>
          </div>
        </div>
        <UpcomingAppointments appointments={appointments} clients={clients} />
      </section>
    </div>
  );
}