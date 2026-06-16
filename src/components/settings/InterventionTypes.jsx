import { useState } from "react";
import { Plus, Trash2, Check, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useInterventionTypes, useRefreshData } from "@/hooks/useData";

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-6 h-6 rounded-full shrink-0 ring-2 ring-offset-2 ring-transparent hover:ring-border transition-all"
          style={{ backgroundColor: value }}
          aria-label="Changer la couleur"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {value === c && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function InterventionTypes() {
  const { data: types } = useInterventionTypes();
  const refresh = useRefreshData();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const add = async () => {
    if (!name.trim()) return;
    await base44.entities.InterventionType.create({ name: name.trim(), color });
    setName("");
    setColor(PALETTE[0]);
    refresh();
  };

  const updateColor = async (t, c) => {
    await base44.entities.InterventionType.update(t.id, { color: c });
    refresh();
  };

  const remove = async (t) => {
    await base44.entities.InterventionType.delete(t.id);
    refresh();
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Tag className="w-[18px] h-[18px]" />
        </div>
        <h2 className="font-display font-bold text-lg">Types d'intervention</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Personnalisez vos prestations et leurs couleurs. Cliquez sur la pastille pour changer la couleur.
      </p>

      <div className="space-y-1.5 mb-4">
        {types.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-2">Aucun type pour l'instant.</p>
        )}
        {types.map((t) => (
          <div
            key={t.id}
            className="group flex items-center gap-3 px-3 py-2 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
          >
            <ColorPicker value={t.color} onChange={(c) => updateColor(t, c)} />
            <span className="flex-1 text-sm font-medium">{t.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => remove(t)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <ColorPicker value={color} onChange={setColor} />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ajouter un type…"
          className="h-10"
        />
        <Button onClick={add} size="icon" className="shrink-0 h-10 w-10">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}