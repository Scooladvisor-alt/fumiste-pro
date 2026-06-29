import { useState, useEffect } from "react";
import { Mail, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function GmailConnectionStatus() {
  const [status, setStatus] = useState("loading"); // loading | connected | disconnected
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke("checkGmailConnection", {});
      setStatus(res?.data?.connected ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
    setChecking(false);
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Mail className="w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-lg">Connexion Gmail</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={check}
              disabled={checking}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compte utilisé pour l'envoi automatique des e-mails (rappels, avis, relances).
          </p>

          <div className="mt-3">
            {status === "loading" ? (
              <span className="text-sm text-muted-foreground">Vérification…</span>
            ) : status === "connected" ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Compte Gmail connecté
              </span>
            ) : (
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-destructive">
                  <XCircle className="w-4 h-4" /> Aucun compte Gmail connecté
                </span>
                <p className="text-xs text-muted-foreground">
                  La connexion Gmail se configure une seule fois au niveau de l'application.
                  Demandez-moi (dans le chat) de reconnecter votre compte Gmail si besoin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}