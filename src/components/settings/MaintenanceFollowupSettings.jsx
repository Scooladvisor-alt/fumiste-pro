import { useState } from "react";
import { Bell, Loader2, Send, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useReminderSettings } from "@/hooks/useReminderSettings";
import HtmlEmailEditor from "./HtmlEmailEditor";

const FOLLOWUP_VARS = [
  { token: "{{client}}", label: "Nom du client" },
  { token: "{{date_dernier_ramonage}}", label: "Date du dernier ramonage" },
];

const MONTH_OPTIONS = [6, 12, 18, 24, 36];

export default function MaintenanceFollowupSettings() {
  const { toast } = useToast();
  const { settings, saving, dirty, update, updateLocal, save } = useReminderSettings();
  const [testing, setTesting] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    const res = await base44.functions.invoke("sendMaintenanceFollowups", {});
    setTesting(false);
    toast({
      title: "Test effectué",
      description: `${res.data?.sent ?? 0} relance(s) envoyée(s).`,
    });
  };

  const handleSave = async () => {
    await save(["followup_subject", "followup_html"]);
    toast({ title: "Enregistré", description: "Le modèle de relance a été sauvegardé." });
  };

  if (!settings) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Relance entretien</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Un e-mail est envoyé automatiquement au client lorsque son dernier ramonage remonte au délai
        défini, pour l'inviter à reprendre rendez-vous.
      </p>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label htmlFor="followup-enabled">Activer les relances automatiques</Label>
        <Switch
          id="followup-enabled"
          checked={settings.followup_enabled}
          onCheckedChange={(v) => update({ followup_enabled: v })}
        />
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label>Relancer après</Label>
        <Select
          value={String(settings.followup_months)}
          onValueChange={(v) => update({ followup_months: Number(v) })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((m) => (
              <SelectItem key={m} value={String(m)}>{m} mois</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="py-4 border-t border-border">
        <HtmlEmailEditor
          subject={settings.followup_subject}
          html={settings.followup_html}
          onSubjectChange={(v) => updateLocal({ followup_subject: v })}
          onHtmlChange={(v) => updateLocal({ followup_html: v })}
          variables={FOLLOWUP_VARS}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={handleSave} disabled={saving || !dirty} size="sm" className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={sendTest} disabled={testing} className="gap-2">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer les relances maintenant
        </Button>
      </div>
    </div>
  );
}