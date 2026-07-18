import { Building2, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useReminderSettings } from "@/hooks/useReminderSettings";

const FIELDS = [
  { key: "company_name", label: "Nom de l'entreprise", placeholder: "Nom de votre entreprise" },
  { key: "company_address", label: "Adresse", placeholder: "12 rue des Ramoneurs, 75000 Paris" },
  { key: "company_phone", label: "Téléphone", placeholder: "06 12 34 56 78" },
  { key: "company_siret", label: "Numéro SIRET", placeholder: "123 456 789 00012" },
  { key: "company_rc_pro", label: "N° d'assurance RC Pro", placeholder: "AXA n°FR-2026-XXX" },
];

export default function CompanyNameSettings() {
  const { settings, saving, updateLocal, save, dirty } = useReminderSettings();

  if (!settings) return null;

  const saveAll = () => save(FIELDS.map((f) => f.key));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Mon entreprise</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Ces informations s'affichent dans le tableau de bord et sont reprises automatiquement sur vos
        certificats de ramonage (SIRET et RC Pro sont des mentions obligatoires du décret 2023-641).
      </p>

      <div className="space-y-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              value={settings[f.key] || ""}
              onChange={(e) => updateLocal({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              onKeyDown={(e) => e.key === "Enter" && dirty && saveAll()}
            />
          </div>
        ))}
        <button
          onClick={saveAll}
          disabled={!dirty || saving}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}