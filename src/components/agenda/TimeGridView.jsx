import { useMemo } from "react";
import { startOfWeek, addDays, isSameDay, format, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0h -> 23h
const HOUR_HEIGHT = 56;
const START_HOUR = 0;

function eventStyle(a) {
  const start = new Date(a.start);
  const end = new Date(a.end);
  const top = ((start.getHours() - START_HOUR) * 60 + start.getMinutes()) * (HOUR_HEIGHT / 60);
  const height = Math.max(24, differenceInMinutes(end, start) * (HOUR_HEIGHT / 60));
  return { top: `${top}px`, height: `${height}px` };
}

export default function TimeGridView({ date, mode, appointments, onSelectSlot, onSelectEvent, onDropEvent }) {
  const days = useMemo(() => {
    if (mode === "day") return [date];
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [date, mode]);

  const now = new Date();
  const nowTop = (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60);

  const handleSlotClick = (day, hour, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetMin = ((e.clientY - rect.top) / HOUR_HEIGHT) * 60;
    const d = new Date(day);
    d.setHours(hour, offsetMin < 30 ? 0 : 30, 0, 0);
    onSelectSlot(d);
  };

  const handleDrop = (day, hour, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetMin = ((e.clientY - rect.top) / HOUR_HEIGHT) * 60;
    const d = new Date(day);
    d.setHours(hour, offsetMin < 30 ? 0 : 30, 0, 0);
    onDropEvent && onDropEvent(id, d);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex sticky top-0 bg-card z-10 border-b border-border">
        <div className="w-14 shrink-0" />
        {days.map((day) => {
          const today = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="flex-1 text-center py-2 border-l border-border">
              <p className="text-xs text-muted-foreground capitalize">{format(day, "EEE", { locale: fr })}</p>
              <p className={cn(
                "text-lg font-display font-bold w-9 h-9 mx-auto flex items-center justify-center rounded-full",
                today && "bg-primary text-primary-foreground"
              )}>
                {format(day, "d", { locale: fr })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex flex-1">
        <div className="w-14 shrink-0">
          {HOURS.map((h) => (
            <div key={h} className="text-[10px] text-muted-foreground text-right pr-2 relative" style={{ height: HOUR_HEIGHT }}>
              {h > 0 && <span className="absolute -top-1.5 right-2">{String(h).padStart(2, "0")}:00</span>}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayEvents = appointments.filter((a) => isSameDay(new Date(a.start), day));
          const isToday = isSameDay(day, now);
          return (
            <div key={day.toISOString()} className="flex-1 relative border-l border-border">
              {isToday && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${nowTop}px` }}>
                  <div className="h-0.5 bg-red-500" />
                  <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-b border-border hover:bg-secondary/40 cursor-pointer"
                  style={{ height: HOUR_HEIGHT }}
                  onClick={(e) => handleSlotClick(day, h, e)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(day, h, e)}
                />
              ))}
              {dayEvents.map((a) => (
                <button
                  key={a.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(a);
                  }}
                  className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left text-white overflow-hidden shadow-sm"
                  style={{ ...eventStyle(a), backgroundColor: a.color || "#3b82f6" }}
                >
                  <p className="text-[11px] font-semibold leading-tight truncate">{a.title}</p>
                  <p className="text-[10px] opacity-90">
                    {format(new Date(a.start), "HH:mm")} - {format(new Date(a.end), "HH:mm")}
                  </p>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}