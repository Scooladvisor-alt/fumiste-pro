import { useState, useEffect } from "react";
import { Mail, Loader2, Send } from "lucide-react";
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

export default function ReminderSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.ReminderSettings.list();
      if (list.length > 0) {
        setSettings(list[0]);
      } else {
        const created = await base44.entities.ReminderSettings.create({
          enabled: true,
          days_before: 2,
        });
        setSettings(created);
      }
    })();
  }, []);

  const update = async (patch) => {
    setSaving(true);
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await base44.entities.ReminderSettings.update(settings.id, patch);
    setSaving(false);
  };

  const sendTest = async () => {
    setTesting(true);
    const res = await base44.functions.invoke("sendDailyReminders", {});
    setTesting(false);
    toast({
      title: "Test effectué",
      description: `${res.data?.sent ?? 0} e-mail(s) envoyé(s) pour les interventions dans ${settings?.days_before} jour(s).`,
    });
  };

  if (!settings) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Rappels e-mail</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Chaque jour, un e-mail de rappel est envoyé automatiquement depuis votre compte Gmail
        aux clients dont l'intervention approche.
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

      <div className="pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={sendTest} disabled={testing} className="gap-2">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer les rappels maintenant
        </Button>
      </div>
    </div>
  );
}