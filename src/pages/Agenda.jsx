import { useState } from "react";
import {
  addDays,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  format,
  differenceInMinutes,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClients, useAppointments, useInterventionTypes, useRefreshData } from "@/hooks/useData";
import MonthView from "@/components/agenda/MonthView";
import TimeGridView from "@/components/agenda/TimeGridView";
import AppointmentDialog from "@/components/agenda/AppointmentDialog";

const VIEWS = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

export default function Agenda() {
  const { data: clients } = useClients();
  const { data: appointments } = useAppointments();
  const { data: types } = useInterventionTypes();
  const refresh = useRefreshData();

  const [view, setView] = useState("week");
  const [cursor, setCursor] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [slotStart, setSlotStart] = useState(null);
  const [slotEnd, setSlotEnd] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await base44.functions.invoke("syncFromGoogle", {});
    await refresh();
    setSyncing(false);
  };

  const navigate = (dir) => {
    if (view === "month") setCursor((c) => (dir > 0 ? addMonths(c, 1) : subMonths(c, 1)));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => addDays(c, dir));
  };

  const openNew = (start, end) => {
    setEditing(null);
    setSlotStart(start || new Date());
    setSlotEnd(end || null);
    setDialogOpen(true);
  };

  const openEdit = (appt) => {
    setEditing(appt);
    setSlotStart(null);
    setSlotEnd(null);
    setDialogOpen(true);
  };

  const moveEvent = async (id, newStart) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    const duration = differenceInMinutes(new Date(appt.end), new Date(appt.start));
    const start = newStart.toISOString();
    const end = new Date(newStart.getTime() + duration * 60000).toISOString();
    await base44.entities.Appointment.update(id, { start, end });
    refresh();
  };

  const moveEventToDay = async (id, day) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    const orig = new Date(appt.start);
    const newStart = new Date(day);
    newStart.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
    await moveEvent(id, newStart);
  };

  const label = () => {
    if (view === "month") return format(cursor, "MMMM yyyy", { locale: fr });
    if (view === "week") {
      const s = startOfWeek(cursor, { weekStartsOn: 1 });
      const e = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(s, "d MMM", { locale: fr })} – ${format(e, "d MMM yyyy", { locale: fr })}`;
    }
    return format(cursor, "EEEE d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())} className="ml-1">
            Aujourd'hui
          </Button>
        </div>

        <h1 className="font-display font-bold text-lg md:text-xl capitalize">{label()}</h1>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            title="Synchroniser avec Google Agenda"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
          </Button>
          <div className="flex bg-secondary rounded-lg p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  view === v.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => openNew(new Date())} className="gap-1.5">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Rendez-vous</span>
          </Button>
        </div>
      </div>

      {/* Views */}
      <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border overflow-hidden">
        {view === "month" ? (
          <MonthView
            date={cursor}
            appointments={appointments}
            onSelectSlot={openNew}
            onSelectEvent={openEdit}
            onDropEvent={moveEventToDay}
          />
        ) : (
          <TimeGridView
            date={cursor}
            mode={view}
            appointments={appointments}
            onSelectSlot={openNew}
            onSelectEvent={openEdit}
            onDropEvent={moveEvent}
          />
        )}
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editing}
        clients={clients}
        types={types}
        defaultStart={slotStart}
        defaultEnd={slotEnd}
      />
    </div>
  );
}