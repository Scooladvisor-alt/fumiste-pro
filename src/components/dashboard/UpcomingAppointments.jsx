import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { isToday, isThisWeek, isAfter, format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Phone, CalendarClock } from "lucide-react";

export default function UpcomingAppointments({ appointments, clients }) {
  const [scope, setScope] = useState("today");

  const list = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => a.start && isAfter(new Date(a.start), now))
      .filter((a) =>
        scope === "today"
          ? isToday(new Date(a.start))
          : isThisWeek(new Date(a.start), { weekStartsOn: 1 })
      )
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [appointments, scope]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-end mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-muted p-1">
            {[
              { v: "today", l: "Aujourd'hui" },
              { v: "week", l: "Cette semaine" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setScope(o.v)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  scope === o.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
          <Link to="/agenda" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Agenda <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm py-6 text-center">
          Aucun rendez-vous {scope === "today" ? "aujourd'hui" : "cette semaine"}.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((a) => {
            const client = clients.find((c) => c.id === a.client_id);
            return (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: a.color || "#3b82f6" }}
                >
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(new Date(a.start), "EEEE d MMM 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
                {client?.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-sm text-primary font-medium shrink-0">
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">{client.phone}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}