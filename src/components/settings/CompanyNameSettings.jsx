import { Building2, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useReminderSettings } from "@/hooks/useReminderSettings";

export default function CompanyNameSettings() {
  const { settings, saving, updateLocal, save, dirty } = useReminderSettings();

  if (!settings) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Mon entreprise</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Ce nom s'affiche dans le tableau de bord (« Bonjour … »).
      </p>

      <div className="space-y-2">
        <Label>Nom affiché</Label>
        <div className="flex gap-2">
          <Input
            value={settings.company_name || ""}
            onChange={(e) => updateLocal({ company_name: e.target.value })}
            placeholder="Nom de votre entreprise"
            onKeyDown={(e) => e.key === "Enter" && dirty && save(["company_name"])}
          />
          <button
            onClick={() => save(["company_name"])}
            disabled={!dirty || saving}
            className="px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 shrink-0"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}