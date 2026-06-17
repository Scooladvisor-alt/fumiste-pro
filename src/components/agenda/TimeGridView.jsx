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

export default function TimeGridView({ date, mode, appointments, onSelectSlot, onSelectEvent, onDropEvent, onResizeEvent }) {
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

  // Resize state (stretch/shrink an existing event)
  const [resizing, setResizing] = useState(null); // { id, startMin, endMin }
  const resizeRef = useRef(null); // { columnEl, appt, edge, startMin, endMin }

  const handleResizeDown = (appt, edge, e) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const columnEl = e.currentTarget.closest("[data-day-column]");
    if (!columnEl) return;
    const start = new Date(appt.start);
    const end = new Date(appt.end);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    resizeRef.current = { columnEl, appt, edge, startMin, endMin };
    columnEl.setPointerCapture(e.pointerId);
    setResizing({ id: appt.id, startMin, endMin });
  };

  const handleResizeMove = (e) => {
    const r = resizeRef.current;
    if (!r) return;
    const cur = yToMinutes(e.clientY, r.columnEl);
    if (r.edge === "top") {
      const startMin = Math.min(cur, r.endMin - SNAP_MIN);
      setResizing({ id: r.appt.id, startMin, endMin: r.endMin });
    } else {
      const endMin = Math.max(cur, r.startMin + SNAP_MIN);
      setResizing({ id: r.appt.id, startMin: r.startMin, endMin });
    }
  };

  const handleResizeUp = () => {
    const r = resizeRef.current;
    resizeRef.current = null;
    if (!r) return;
    const cur = resizing;
    setResizing(null);
    if (!cur) return;
    const day = new Date(r.appt.start);
    const newStart = dateFromMinutes(day, cur.startMin);
    const newEnd = dateFromMinutes(day, cur.endMin);
    if (cur.startMin !== r.startMin || cur.endMin !== r.endMin) {
      onResizeEvent && onResizeEvent(r.appt.id, newStart, newEnd);
    }
  };

  const handlePointerDown = (day, e) => {
    if (resizeRef.current) return;
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
              data-day-column
              className="flex-1 relative border-l border-border select-none touch-none"
              style={{ height: HOUR_HEIGHT * 24 }}
              onPointerDown={(e) => handlePointerDown(day, e)}
              onPointerMove={(e) => {
                handleResizeMove(e);
                handlePointerMove(e);
              }}
              onPointerUp={(e) => {
                handleResizeUp(e);
                handlePointerUp(e);
              }}
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

              {dayEvents.map((a) => {
                const isResizing = resizing && resizing.id === a.id;
                const style = isResizing
                  ? {
                      top: `${minutesToTop(resizing.startMin)}px`,
                      height: `${Math.max(24, (resizing.endMin - resizing.startMin) * (HOUR_HEIGHT / 60))}px`,
                    }
                  : eventStyle(a);
                const startLabel = isResizing
                  ? `${String(Math.floor(resizing.startMin / 60)).padStart(2, "0")}:${String(resizing.startMin % 60).padStart(2, "0")}`
                  : format(new Date(a.start), "HH:mm");
                const endLabel = isResizing
                  ? `${String(Math.floor(resizing.endMin / 60)).padStart(2, "0")}:${String(resizing.endMin % 60).padStart(2, "0")}`
                  : format(new Date(a.end), "HH:mm");
                return (
                  <div
                    key={a.id}
                    draggable={!isResizing}
                    onPointerDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isResizing) onSelectEvent(a);
                    }}
                    className="absolute left-1 right-1 z-10 rounded-lg px-2 py-1 text-left text-white overflow-hidden shadow-sm cursor-pointer group"
                    style={{ ...style, backgroundColor: a.color || "#3b82f6" }}
                  >
                    <div
                      onPointerDown={(e) => handleResizeDown(a, "top", e)}
                      className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                    >
                      <div className="mx-auto mt-0.5 w-6 h-1 rounded-full bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] font-semibold leading-tight truncate">{a.title}</p>
                    <p className="text-[10px] opacity-90">
                      {startLabel} - {endLabel}
                    </p>
                    <EventBadges appointment={a} className="mt-0.5" />
                    <div
                      onPointerDown={(e) => handleResizeDown(a, "bottom", e)}
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                    >
                      <div className="mx-auto mb-0.5 w-6 h-1 rounded-full bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}