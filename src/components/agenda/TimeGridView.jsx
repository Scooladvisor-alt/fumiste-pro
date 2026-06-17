import { useMemo, useState, useRef } from "react";
import { startOfWeek, addDays, isSameDay, format, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import EventBadges from "./EventBadges";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0h -> 23h
const HOUR_HEIGHT = 56;
const START_HOUR = 0;
const SNAP_MIN = 15;

function minutesToTop(min) {
  return (min - START_HOUR * 60) * (HOUR_HEIGHT / 60);
}

function eventStyle(a) {
  const start = new Date(a.start);
  const end = new Date(a.end);
  const top = minutesToTop(start.getHours() * 60 + start.getMinutes());
  const height = Math.max(24, differenceInMinutes(end, start) * (HOUR_HEIGHT / 60));
  return { top: `${top}px`, height: `${height}px` };
}

// Snap a pointer Y position (relative to the day column) to minutes-of-day
function yToMinutes(clientY, columnEl) {
  const rect = columnEl.getBoundingClientRect();
  const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
  const raw = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60;
  return Math.round(raw / SNAP_MIN) * SNAP_MIN;
}

function dateFromMinutes(day, minutes) {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(Math.max(0, Math.min(24 * 60 - SNAP_MIN, minutes)));
  return d;
}

export default function TimeGridView({ date, mode, appointments, onSelectSlot, onSelectEvent, onDropEvent }) {
  const days = useMemo(() => {
    if (mode === "day") return [date];
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [date, mode]);

  const now = new Date();
  const nowTop = minutesToTop(now.getHours() * 60 + now.getMinutes());

  // Drag-to-create state
  const [draft, setDraft] = useState(null); // { dayKey, startMin, endMin }
  const dragRef = useRef(null); // { columnEl, day, startMin, moved }

  const handlePointerDown = (day, e) => {
    if (e.button !== 0) return;
    const columnEl = e.currentTarget;
    const startMin = yToMinutes(e.clientY, columnEl);
    dragRef.current = { columnEl, day, startMin, moved: false };
    columnEl.setPointerCapture(e.pointerId);
    setDraft({ dayKey: day.toISOString(), startMin, endMin: startMin + SNAP_MIN });
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const cur = yToMinutes(e.clientY, drag.columnEl);
    if (Math.abs(cur - drag.startMin) >= SNAP_MIN) drag.moved = true;
    const startMin = Math.min(drag.startMin, cur);
    const endMin = Math.max(drag.startMin, cur);
    setDraft({
      dayKey: drag.day.toISOString(),
      startMin,
      endMin: endMin === startMin ? startMin + SNAP_MIN : endMin,
    });
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const d = draft;
    setDraft(null);
    if (!d) return;
    const start = dateFromMinutes(drag.day, d.startMin);
    if (drag.moved) {
      const end = dateFromMinutes(drag.day, d.endMin);
      onSelectSlot(start, end);
    } else {
      onSelectSlot(start);
    }
  };

  const handleDrop = (day, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const minutes = yToMinutes(e.clientY, e.currentTarget);
    onDropEvent && onDropEvent(id, dateFromMinutes(day, minutes));
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
          const dayDraft = draft && draft.dayKey === day.toISOString() ? draft : null;
          return (
            <div
              key={day.toISOString()}
              className="flex-1 relative border-l border-border select-none touch-none"
              style={{ height: HOUR_HEIGHT * 24 }}
              onPointerDown={(e) => handlePointerDown(day, e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(day, e)}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-b border-border hover:bg-secondary/30"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {isToday && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${nowTop}px` }}>
                  <div className="h-0.5 bg-red-500" />
                  <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}

              {dayDraft && (
                <div
                  className="absolute left-1 right-1 z-10 rounded-lg bg-primary/30 border-2 border-primary pointer-events-none flex items-start px-2 py-1"
                  style={{
                    top: `${minutesToTop(dayDraft.startMin)}px`,
                    height: `${(dayDraft.endMin - dayDraft.startMin) * (HOUR_HEIGHT / 60)}px`,
                  }}
                >
                  <span className="text-[10px] font-semibold text-primary">
                    {String(Math.floor(dayDraft.startMin / 60)).padStart(2, "0")}:
                    {String(dayDraft.startMin % 60).padStart(2, "0")}
                    {" – "}
                    {String(Math.floor(dayDraft.endMin / 60)).padStart(2, "0")}:
                    {String(dayDraft.endMin % 60).padStart(2, "0")}
                  </span>
                </div>
              )}

              {dayEvents.map((a) => (
                <button
                  key={a.id}
                  draggable
                  onPointerDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(a);
                  }}
                  className="absolute left-1 right-1 z-10 rounded-lg px-2 py-1 text-left text-white overflow-hidden shadow-sm"
                  style={{ ...eventStyle(a), backgroundColor: a.color || "#3b82f6" }}
                >
                  <p className="text-[11px] font-semibold leading-tight truncate">{a.title}</p>
                  <p className="text-[10px] opacity-90">
                    {format(new Date(a.start), "HH:mm")} - {format(new Date(a.end), "HH:mm")}
                  </p>
                  <EventBadges appointment={a} className="mt-0.5" />
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}