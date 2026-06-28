import { useEffect, useState } from "react";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Mode mono-utilisateur : Gmail est connecté une seule fois au compte Google du
// propriétaire de l'app (intégration native partagée Base44). Cet écran affiche
// simplement l'état de cette connexion — aucune action requise.
export default function GmailConnect() {
  const [status, setStatus] = useState("loading"); // loading | connected | disconnected

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("checkGmailConnection", {});
        setStatus(res.data?.connected ? "connected" : "disconnected");
      } catch {
        setStatus("disconnected");
      }
    })();
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Mail className="w-[18px] h-[18px]" />
        </div>
        <h2 className="font-display font-bold text-lg">Gmail</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Les rappels d'intervention, les demandes d'avis Google et les relances
        d'entretien sont envoyés automatiquement depuis votre adresse Gmail.
      </p>

      {status === "loading" ? (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Vérification…
        </div>
      ) : status === "connected" ? (
        <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4" />
          Connecté
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          Gmail non connecté
        </div>
      )}
    </div>
  );
}