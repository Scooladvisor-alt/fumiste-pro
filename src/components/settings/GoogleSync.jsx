import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const CALENDAR_CONNECTOR_ID = "6a32cbfde2927ef1458ec237";

export default function GoogleSync() {
  const [status, setStatus] = useState("loading"); // loading | connected | disconnected
  const [connecting, setConnecting] = useState(false);

  const check = async () => {
    try {
      const res = await base44.functions.invoke("checkCalendarConnection", {});
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
    // Ouvrir le popup IMMÉDIATEMENT (dans le geste du clic) pour éviter qu'il
    // soit bloqué et que l'OAuth s'ouvre dans l'onglet principal (ce qui
    // déconnecterait l'utilisateur du logiciel).
    const popup = window.open("about:blank", "_blank", "width=520,height=640");
    try {
      const url = await base44.connectors.connectAppUser(CALENDAR_CONNECTOR_ID);
      if (popup) popup.location.href = url;
      else window.open(url, "_blank");
    } catch {
      if (popup) popup.close();
      setConnecting(false);
      return;
    }
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        check();
        setConnecting(false);
      }
    }, 500);
  };

  const disconnect = async () => {
    await base44.connectors.disconnectAppUser(CALENDAR_CONNECTOR_ID);
    setStatus("disconnected");
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Calendar className="w-[18px] h-[18px]" />
        </div>
        <h2 className="font-display font-bold text-lg">Google Calendar</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Connectez votre Google Calendar pour que vos rendez-vous clients soient
        synchronisés automatiquement avec votre agenda Google.
      </p>

      {status === "loading" ? (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Vérification…
        </div>
      ) : status === "connected" ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            Connecté et synchronisé
          </div>
          <Button variant="ghost" size="sm" onClick={disconnect} className="text-muted-foreground">
            Déconnecter
          </Button>
        </div>
      ) : (
        <Button onClick={connect} disabled={connecting} className="gap-2">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Connecter Google Calendar
        </Button>
      )}
    </div>
  );
}