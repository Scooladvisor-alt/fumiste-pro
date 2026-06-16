import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientSelect from "./ClientSelect";
import { buildTitle, buildDescription } from "@/lib/appointments";
import { useRefreshData } from "@/hooks/useData";

function toDateInput(d) {
  return format(new Date(d), "yyyy-MM-dd");
}
function toTimeInput(d) {
  return format(new Date(d), "HH:mm");
}
function combine(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export default function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  clients,
  types,
  defaultStart,
}) {
  const refresh = useRefreshData();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!open) return;
    const base = appointment || {};
    const start = base.start ? new Date(base.start) : defaultStart || new Date();
    const end = base.end
      ? new Date(base.end)
      : new Date(start.getTime() + 60 * 60 * 1000);
    setForm({
      client_id: base.client_id || "",
      intervention_type: base.intervention_type || (types[0]?.name ?? ""),
      date: toDateInput(start),
      startTime: toTimeInput(start),
      endTime: toTimeInput(end),
      notes: base.notes || "",
    });
  }, [open, appointment, defaultStart, types]);

  if (!form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const client = clients.find((c) => c.id === form.client_id);
    const typeObj = types.find((t) => t.name === form.intervention_type);
    const start = combine(form.date, form.startTime);
    const end = combine(form.date, form.endTime);
    const payload = {
      client_id: form.client_id,
      intervention_type: form.intervention_type,
      start,
      end,
      notes: form.notes,
      color: typeObj?.color || "#3b82f6",
      title: buildTitle(form.intervention_type, client?.full_name),
      description: buildDescription(client, form.intervention_type, form.notes),
    };
    if (appointment?.id) {
      await base44.entities.Appointment.update(appointment.id, payload);
    } else {
      await base44.entities.Appointment.create(payload);
    }
    refresh();
    setSaving(false);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;
    setSaving(true);
    await base44.entities.Appointment.delete(appointment.id);
    refresh();
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {appointment?.id ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <ClientSelect
              clients={clients}
              value={form.client_id}
              onChange={(v) => set("client_id", v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type d'intervention</Label>
            <Select
              value={form.intervention_type}
              onValueChange={(v) => set("intervention_type", v)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Début</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fin</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Informations complémentaires…"
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {appointment?.id ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={saving}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.client_id}>
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}