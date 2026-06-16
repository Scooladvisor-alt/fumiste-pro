import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function MonthView({ date, appointments, onSelectSlot, onSelectEvent, onDropEvent }) {
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsFor = (day) =>
    appointments
      .filter((a) => isSameDay(new Date(a.start), day))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day) => {
          const inMonth = isSameMonth(day, date);
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectSlot(new Date(day.setHours(9, 0, 0, 0)))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                onDropEvent && onDropEvent(id, day);
              }}
              className={cn(
                "min-h-[96px] border-b border-r border-border p-1.5 cursor-pointer transition-colors hover:bg-secondary/60",
                !inMonth && "bg-secondary/30"
              )}
            >
              <div className="flex justify-end mb-1">
                <span
                  className={cn(
                    "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                    today ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground",
                    !inMonth && "opacity-40"
                  )}
                >
                  {format(day, "d", { locale: fr })}
                </span>
              </div>
              <div className="space-y-1">
                {eventsFor(day).slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/plain", a.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(a);
                    }}
                    className="w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded-md truncate text-white font-medium"
                    style={{ backgroundColor: a.color || "#3b82f6" }}
                  >
                    {format(new Date(a.start), "HH:mm")} {a.title}
                  </button>
                ))}
                {eventsFor(day).length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">
                    +{eventsFor(day).length - 3}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}