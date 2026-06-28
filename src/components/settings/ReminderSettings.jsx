import { useState } from "react";
import { Mail, Loader2, Send, Save } from "lucide-react";
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
import ConfirmationButtonHelper from "./ConfirmationButtonHelper";

const REMINDER_VARS = [
  { token: "{{client}}", label: "Nom du client" },
  { token: "{{date}}", label: "Date de l'intervention" },
  { token: "{{heure}}", label: "Heure de l'intervention" },
  { token: "{{type}}", label: "Type d'intervention" },
  { token: "{{lien_confirmation}}", label: "Lien de confirmation de présence" },
];

export default function ReminderSettings() {
  const { toast } = useToast();
  const { settings, saving, dirty, update, updateLocal, save } = useReminderSettings();
  const [testing, setTesting] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    const res = await base44.functions.invoke("sendDailyReminders", {});
    setTesting(false);
    toast({
      title: "Test effectué",
      description: `${res.data?.sent ?? 0} e-mail(s) envoyé(s) pour les interventions dans ${settings?.days_before} jour(s).`,
    });
  };

  const handleSave = async () => {
    await save(["reminder_subject", "reminder_html"]);
    toast({ title: "Enregistré", description: "Le modèle de rappel a été sauvegardé." });
  };

  if (!settings) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Rappel e-mail</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Un e-mail de rappel est envoyé automatiquement aux clients avant leur intervention.
      </p>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label htmlFor="reminder-enabled">Activer les rappels automatiques</Label>
        <Switch
          id="reminder-enabled"
          checked={settings.enabled}
          onCheckedChange={(v) => update({ enabled: v })}
        />
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label>Envoyer le rappel</Label>
        <Select
          value={String(settings.days_before)}
          onValueChange={(v) => update({ days_before: Number(v) })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 jour avant</SelectItem>
            <SelectItem value="2">2 jours avant</SelectItem>
            <SelectItem value="3">3 jours avant</SelectItem>
            <SelectItem value="7">7 jours avant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="py-4 border-t border-border">
        <div className="mb-4">
          <ConfirmationButtonHelper />
        </div>
        <HtmlEmailEditor
          subject={settings.reminder_subject}
          html={settings.reminder_html}
          onSubjectChange={(v) => updateLocal({ reminder_subject: v })}
          onHtmlChange={(v) => updateLocal({ reminder_html: v })}
          variables={REMINDER_VARS}
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
          Envoyer les rappels maintenant
        </Button>
      </div>
    </div>
  );
}