import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  isToday,
  isThisWeek,
  format,
  isAfter,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Users, CalendarCheck, CalendarRange, ArrowRight, Clock, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useClients, useAppointments } from "@/hooks/useData";
import StatCard from "@/components/dashboard/StatCard";

export default function Dashboard() {
  const { data: clients } = useClients();
  const { data: appointments } = useAppointments();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    base44.auth.me().then((u) => setUserName(u?.full_name?.split(" ")[0] || "")).catch(() => {});
  }, []);

  const todayCount = useMemo(
    () => appointments.filter((a) => isToday(new Date(a.start))).length,
    [appointments]
  );
  const weekCount = useMemo(
    () => appointments.filter((a) => isThisWeek(new Date(a.start), { weekStartsOn: 1 })).length,
    [appointments]
  );
  const next = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => isAfter(new Date(a.start), now))
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  }, [appointments]);

  const nextClient = next ? clients.find((c) => c.id === next.client_id) : null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl">
          Bonjour{userName ? ` ${userName}` : ""} 👋
        </h1>
        <p className="text-muted-foreground capitalize">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Clients" value={clients.length} accent="bg-primary/10 text-primary" />
        <StatCard icon={CalendarCheck} label="Aujourd'hui" value={todayCount} accent="bg-emerald-100 text-emerald-600" />
        <StatCard icon={CalendarRange} label="Cette semaine" value={weekCount} accent="bg-amber-100 text-amber-600" />
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Prochain rendez-vous</h2>
          <Link to="/agenda" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Voir l'agenda <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {next ? (
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: next.color || "#3b82f6" }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{next.title}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {format(new Date(next.start), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
              </p>
            </div>
            {nextClient && (
              <a href={`tel:${nextClient.phone}`} className="flex items-center gap-1.5 text-sm text-primary font-medium shrink-0">
                <Phone className="w-4 h-4" /> <span className="hidden sm:inline">{nextClient.phone}</span>
              </a>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4">Aucun rendez-vous à venir.</p>
        )}
      </div>
    </div>
  );
}