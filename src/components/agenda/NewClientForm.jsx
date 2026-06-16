import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRefreshData } from "@/hooks/useData";

export default function NewClientForm({ initialName = "", onCreated, onBack }) {
  const refresh = useRefreshData();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    full_name: initialName,
    phone: "",
    email: "",
    city: "",
  });

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.full_name.trim() || !data.phone.trim()) return;
    setSaving(true);
    const created = await base44.entities.Client.create({
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      city: data.city.trim(),
    });
    await refresh();
    setSaving(false);
    onCreated(created.id);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la recherche
      </button>

      <div className="space-y-1.5">
        <Label className="text-xs">Nom et prénom *</Label>
        <Input
          autoFocus
          value={data.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="Jean Dupont"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Téléphone *</Label>
        <Input
          value={data.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Ville</Label>
          <Input value={data.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input value={data.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={saving || !data.full_name.trim() || !data.phone.trim()}
      >
        {saving ? "Création…" : "Créer et sélectionner"}
      </Button>
    </form>
  );
}