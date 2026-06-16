import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInterventionTypes, useRefreshData } from "@/hooks/useData";

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function InterventionTypes() {
  const { data: types } = useInterventionTypes();
  const refresh = useRefreshData();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const add = async () => {
    if (!name.trim()) return;
    await base44.entities.InterventionType.create({ name: name.trim(), color });
    setName("");
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
      <h2 className="font-display font-bold text-lg mb-1">Types d'intervention</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Personnalisez vos prestations et leurs couleurs.
      </p>

      <div className="space-y-2 mb-4">
        {types.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
            <div className="flex gap-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => updateColor(t, c)}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {t.color === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
            <span className="flex-1 text-sm font-medium">{t.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              onClick={() => remove(t)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 shrink-0">
          {PALETTE.slice(0, 5).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nouveau type…"
          className="h-10"
        />
        <Button onClick={add} size="icon" className="shrink-0 h-10 w-10">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}