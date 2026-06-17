import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function SendEmailsNow() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { totalSent } | { error }

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendMyEmails", {});
      if (res.data?.error) {
        setResult({ error: res.data.error });
      } else {
        setResult({ totalSent: res.data?.totalSent ?? 0 });
      }
    } catch (e) {
      setResult({ error: e?.response?.data?.error || "send_failed" });
    }
    setSending(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Send className="w-[18px] h-[18px]" />
        </div>
        <h2 className="font-display font-bold text-lg">Envoyer les e-mails du jour</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Envoie maintenant, depuis votre Gmail connecté, les rappels d'intervention,
        les demandes d'avis Google et les relances d'entretien dus aujourd'hui (selon vos réglages).
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={send} disabled={sending} className="gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer maintenant
        </Button>

        {result?.totalSent !== undefined && (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            {result.totalSent} e-mail{result.totalSent > 1 ? "s" : ""} envoyé{result.totalSent > 1 ? "s" : ""}
          </span>
        )}

        {result?.error && (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            {result.error === "gmail_not_connected"
              ? "Connectez d'abord votre Gmail ci-dessus."
              : "Échec de l'envoi, réessayez."}
          </span>
        )}
      </div>
    </div>
  );
}