import { useEffect, useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function GmailConnect() {
  const [status, setStatus] = useState("loading"); // loading | connected | disconnected
  const [connecting, setConnecting] = useState(false);

  const check = async () => {
    try {
      const res = await base44.functions.invoke("checkGmailConnection", {});
      setStatus(res.data?.connected ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    check();
  }, []);

  const connect = async () => {
    setConnecting(true);
    await base44.connectors.authorize("gmail", {
      scopes: ["https://www.googleapis.com/auth/gmail.send", "email"],
    });
    await check();
    setConnecting(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Mail className="w-[18px] h-[18px]" />
        </div>
        <h2 className="font-display font-bold text-lg">Gmail</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Connectez votre compte Gmail pour que les rappels d'intervention et les demandes d'avis
        Google soient envoyés automatiquement depuis votre adresse.
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
        <Button onClick={connect} disabled={connecting} className="gap-2">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Connecter Gmail
        </Button>
      )}
    </div>
  );
}