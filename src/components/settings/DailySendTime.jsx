import { Clock, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReminderSettings } from "@/hooks/useReminderSettings";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DailySendTime() {
  const { settings, saving, update } = useReminderSettings();

  if (!settings) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Heure d'envoi automatique</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Chaque jour à cette heure, le logiciel analyse l'agenda pour envoyer les rappels
        d'intervention et les demandes d'avis Google.
      </p>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label>Heure de passage quotidien</Label>
        <Select
          value={String(settings.daily_send_hour ?? 9)}
          onValueChange={(v) => update({ daily_send_hour: Number(v) })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={String(h)}>
                {String(h).padStart(2, "0")}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}