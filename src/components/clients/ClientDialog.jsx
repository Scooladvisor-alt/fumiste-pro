import { useState, useEffect } from "react";
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
import { useRefreshData } from "@/hooks/useData";

const EMPTY = { full_name: "", phone: "", email: "", city: "", notes: "" };

export default function ClientDialog({ open, onOpenChange, client }) {
  const refresh = useRefreshData();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(client ? { ...EMPTY, ...client } : EMPTY);
  }, [open, client]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.full_name.trim() && form.phone.trim();

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      full_name: form.full_name,
      phone: form.phone,
      email: form.email,
      city: form.city,
      notes: form.notes,
    };
    if (client?.id) await base44.entities.Client.update(client.id, payload);
    else await base44.entities.Client.create(payload);
    refresh();
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {client?.id ? "Modifier le client" : "Nouveau client"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Nom et prénom *</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="h-11" placeholder="Jean Dupont" />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone *</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-11" placeholder="06 12 34 56 78" />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-11" placeholder="jean@exemple.fr" />
          </div>
          <div className="space-y-1.5">
            <Label>Ville</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} className="h-11" placeholder="Lyon" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="resize-none" placeholder="Informations utiles…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={!valid || saving}>{saving ? "…" : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}