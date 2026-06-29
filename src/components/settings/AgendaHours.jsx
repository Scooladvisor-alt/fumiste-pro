import { CalendarClock, Loader2 } from "lucide-react";
import { useReminderSettings } from "@/hooks/useReminderSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const START_OPTIONS = Array.from({ length: 24 }, (_, i) => i); // 0h -> 23h
const END_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1); // 1h -> 24h

export default function AgendaHours() {
  const { settings, saving, update } = useReminderSettings();

  if (!settings) return null;

  const start = settings.agenda_start_hour ?? 6;
  const end = settings.agenda_end_hour ?? 20;

  const setStart = (val) => {
    const s = Number(val);
    // garde la fin strictement après le début
    const patch = { agenda_start_hour: s };
    if (end <= s) patch.agenda_end_hour = Math.min(24, s + 1);
    update(patch);
  };

  const setEnd = (val) => {
    const e = Number(val);
    const patch = { agenda_end_hour: e };
    if (start >= e) patch.agenda_start_hour = Math.max(0, e - 1);
    update(patch);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <CalendarClock className="w-[18px] h-[18px]" />
        </div>
        <h2 className="font-display font-bold text-lg">Plage horaire de l'agenda</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Choisissez les heures affichées dans l'agenda. Par défaut de 6h à 20h pour masquer la nuit.
        Pour afficher toute la journée, mettez le début à 0h et la fin à 24h.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Heure de début</label>
          <Select value={String(start)} onValueChange={setStart}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {START_OPTIONS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Heure de fin</label>
          <Select value={String(end)} onValueChange={setEnd}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {END_OPTIONS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}