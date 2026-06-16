import { useState } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

const REVIEW_VARS = [
  { token: "{{client}}", label: "Nom du client" },
  { token: "{{date}}", label: "Date de l'intervention" },
  { token: "{{heure}}", label: "Heure de l'intervention" },
  { token: "{{type}}", label: "Type d'intervention" },
  { token: "{{lien_avis}}", label: "Lien avis Google" },
];

export default function GoogleReviewSettings() {
  const { toast } = useToast();
  const { settings, saving, update } = useReminderSettings();
  const [testing, setTesting] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    const res = await base44.functions.invoke("sendGoogleReviewRequests", {});
    setTesting(false);
    toast({
      title: "Test effectué",
      description: `${res.data?.sent ?? 0} demande(s) d'avis envoyée(s).`,
    });
  };

  if (!settings) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Star className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Demande d'avis Google</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Un e-mail invitant le client à laisser un avis Google est envoyé après l'intervention.
      </p>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label htmlFor="review-enabled">Activer les demandes d'avis</Label>
        <Switch
          id="review-enabled"
          checked={settings.review_enabled}
          onCheckedChange={(v) => update({ review_enabled: v })}
        />
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <Label>Envoyer la demande</Label>
        <Select
          value={String(settings.review_days_after)}
          onValueChange={(v) => update({ review_days_after: Number(v) })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 jour après</SelectItem>
            <SelectItem value="2">2 jours après</SelectItem>
            <SelectItem value="3">3 jours après</SelectItem>
            <SelectItem value="7">7 jours après</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="py-3 border-t border-border space-y-1.5">
        <Label>Lien de la page d'avis Google</Label>
        <Input
          value={settings.google_review_link || ""}
          onChange={(e) => update({ google_review_link: e.target.value })}
          placeholder="https://g.page/r/..."
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Ce lien remplace la variable <span className="font-mono">{"{{lien_avis}}"}</span> dans l'e-mail.
        </p>
      </div>

      <div className="py-4 border-t border-border">
        <HtmlEmailEditor
          subject={settings.review_subject}
          html={settings.review_html}
          onSubjectChange={(v) => update({ review_subject: v })}
          onHtmlChange={(v) => update({ review_html: v })}
          variables={REVIEW_VARS}
        />
      </div>

      <div className="pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={sendTest} disabled={testing} className="gap-2">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer les demandes maintenant
        </Button>
      </div>
    </div>
  );
}