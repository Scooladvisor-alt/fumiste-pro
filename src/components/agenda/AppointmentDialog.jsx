import { useState, useEffect } from "react";
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
import { buildTitle } from "@/lib/appointments";
import { useRefreshData } from "@/hooks/useData";

export default function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  clients,
  types,
  defaultStart,
  defaultEnd,
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
      : defaultEnd || new Date(start.getTime() + 60 * 60 * 1000);
    const client = clients.find((c) => c.id === base.client_id);
    const type = base.intervention_type || (types[0]?.name ?? "");
    setForm({
      client_id: base.client_id || "",
      intervention_type: type,
      start: start.toISOString(),
      end: end.toISOString(),
      title: base.title || buildTitle(type, client?.full_name),
      titleEdited: !!base.title,
      notes: base.notes || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment, defaultStart, defaultEnd]);

  if (!form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pad = (n) => String(n).padStart(2, "0");
  const toDateInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const toTimeInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Merge a date string (YYYY-MM-DD) and time string (HH:mm) into a Date
  const mergeDateTime = (iso, datePart, timePart) => {
    const base = iso ? new Date(iso) : new Date();
    const date = datePart || toDateInput(base.toISOString());
    const time = timePart || toTimeInput(base.toISOString());
    return new Date(`${date}T${time}`);
  };

  // When the start changes, keep the same duration by shifting the end
  const setStart = (newStart) => {
    if (isNaN(newStart?.getTime())) return;
    setForm((f) => {
      const duration = new Date(f.end).getTime() - new Date(f.start).getTime();
      const safe = duration > 0 ? duration : 60 * 60 * 1000;
      return { ...f, start: newStart.toISOString(), end: new Date(newStart.getTime() + safe).toISOString() };
    });
  };

  const setEnd = (newEnd) => {
    if (isNaN(newEnd?.getTime())) return;
    setForm((f) => ({ ...f, end: newEnd.toISOString() }));
  };

  // Build the auto contact block injected at the top of the description
  const buildContactBlock = (client) => {
    if (!client) return "";
    return [
      `Client : ${client.full_name || "-"}`,
      `Téléphone : ${client.phone || "-"}`,
      `Email : ${client.email || "-"}`,
    ].join("\n");
  };

  // When selecting a client: auto-fill title AND prepend phone + email to the description
  const setClient = (v, createdClient) => {
    const client = createdClient || clients.find((c) => c.id === v);
    setForm((f) => ({
      ...f,
      client_id: v,
      title: f.titleEdited ? f.title : buildTitle(f.intervention_type, client?.full_name),
      notes: client ? buildContactBlock(client) : f.notes,
    }));
  };
  const setType = (v) => {
    const client = clients.find((c) => c.id === form.client_id);
    setForm((f) => ({
      ...f,
      intervention_type: v,
      title: buildTitle(v, client?.full_name),
      titleEdited: false,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const typeObj = types.find((t) => t.name === form.intervention_type);
    const payload = {
      client_id: form.client_id,
      intervention_type: form.intervention_type,
      start: form.start,
      end: form.end,
      notes: form.notes,
      color: typeObj?.color || "#3b82f6",
      title: form.title,
      description: form.notes,
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
              onChange={setClient}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type d'intervention</Label>
            <Select
              value={form.intervention_type}
              onValueChange={setType}
            >
              <SelectTrigger className={form.intervention_type ? "h-11 shine-select border-ember/40 ring-1 ring-ember/20" : "h-11"}>
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
            <Label>Titre</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, titleEdited: true }))}
              placeholder="Titre du rendez-vous"
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Début</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={toDateInput(form.start)}
                  onChange={(e) => setStart(mergeDateTime(form.start, e.target.value, null))}
                  className="h-11 font-bold flex-1"
                />
                <Input
                  type="time"
                  value={toTimeInput(form.start)}
                  onChange={(e) => setStart(mergeDateTime(form.start, null, e.target.value))}
                  className="h-11 w-24"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fin</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={toDateInput(form.end)}
                  onChange={(e) => setEnd(mergeDateTime(form.end, e.target.value, null))}
                  className="h-11 font-bold flex-1"
                />
                <Input
                  type="time"
                  value={toTimeInput(form.end)}
                  onChange={(e) => setEnd(mergeDateTime(form.end, null, e.target.value))}
                  className="h-11 w-24"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Description de l'événement…"
              className="resize-none"
              rows={5}
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
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}