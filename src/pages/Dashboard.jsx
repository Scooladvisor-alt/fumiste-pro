import { useMemo, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useClients, useAppointments, useCommunicationLogs } from "@/hooks/useData";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import CommunicationStats from "@/components/dashboard/CommunicationStats";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";

export default function Dashboard() {
  const { data: clients } = useClients();
  const { data: appointments } = useAppointments();
  const { data: logs } = useCommunicationLogs();
  const [userName, setUserName] = useState("");
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    base44.auth.me().then((u) => setUserName(u?.full_name?.split(" ")[0] || "")).catch(() => {});
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
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">
            Bonjour{userName ? ` ${userName}` : ""} 👋
          </h1>
          <p className="text-muted-foreground capitalize">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-card border border-border rounded-xl px-3 py-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-semibold">{clients.length}</span>
          <span className="text-muted-foreground">clients</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
          <h2 className="font-display font-bold text-lg">Tour de contrôle</h2>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
        <CommunicationStats counts={counts} total={total} />
      </div>

      <UpcomingAppointments appointments={appointments} clients={clients} />
    </div>
  );
}