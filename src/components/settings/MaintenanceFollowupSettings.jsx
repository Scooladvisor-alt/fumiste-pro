import { useState } from "react";
import { Bell, Loader2, Send, Save, Droplets } from "lucide-react";
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

const ETANCHEITE_VARS = [
  { token: "{{client}}", label: "Nom du client" },
  { token: "{{date_dernier_test}}", label: "Date du dernier test d'étanchéité" },
];

const MONTH_OPTIONS = [6, 12];

export default function MaintenanceFollowupSettings() {
  const { toast } = useToast();
  const { settings, saving, dirty, update, updateLocal, save } = useReminderSettings();
  const [testing, setTesting] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    const res = await base44.functions.invoke("sendMaintenanceFollowups", { manual: true });
    setTesting(false);
    const sent = (res.data?.ramonage?.sent ?? 0) + (res.data?.etancheite?.sent ?? 0);
    toast({
      title: "Test effectué",
      description: `${sent} relance(s) envoyée(s).`,
    });
  };

  const handleSave = async () => {
    await save([
      "followup_subject",
      "followup_html",
      "etancheite_followup_subject",
      "etancheite_followup_html",
    ]);
    toast({ title: "Enregistré", description: "Les modèles de relance ont été sauvegardés." });
  };

  if (!settings) return null;

  if (settings.etancheite_followup_months !== 36) {
    update({ etancheite_followup_months: 36 });
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Relance ramonage (annuel)</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Le ramonage est obligatoire chaque année. Un e-mail est envoyé automatiquement au client
        lorsque son dernier ramonage remonte au délai défini, pour l'inviter à reprendre rendez-vous.
      </p>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label htmlFor="followup-enabled">Activer les relances ramonage</Label>
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

      {/* --- Test d'étanchéité (triennal) --- */}
      <div className="flex items-center gap-2 pt-5 mt-1 border-t border-border">
        <Droplets className="w-5 h-5 text-cyan-600" />
        <h2 className="font-display font-semibold text-lg">Relance test d'étanchéité (triennal)</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-1 mt-1">
        Le test d'étanchéité est obligatoire tous les 3 ans. Un e-mail est envoyé automatiquement
        lorsque le dernier test remonte au délai défini.
      </p>

      <div className="flex items-center justify-between py-3">
        <Label htmlFor="etancheite-enabled">Activer les relances étanchéité</Label>
        <Switch
          id="etancheite-enabled"
          checked={settings.etancheite_followup_enabled}
          onCheckedChange={(v) => update({ etancheite_followup_enabled: v })}
        />
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label>Relancer après</Label>
        <span className="text-sm font-medium text-muted-foreground">36 mois (obligation légale)</span>
      </div>

      <div className="py-4 border-t border-border">
        <HtmlEmailEditor
          subject={settings.etancheite_followup_subject}
          html={settings.etancheite_followup_html}
          onSubjectChange={(v) => updateLocal({ etancheite_followup_subject: v })}
          onHtmlChange={(v) => updateLocal({ etancheite_followup_html: v })}
          variables={ETANCHEITE_VARS}
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