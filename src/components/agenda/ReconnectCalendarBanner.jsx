import { useState } from "react";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const CALENDAR_CONNECTOR_ID = "6a32cbfde2927ef1458ec237";

// Bannière affichée quand Google Agenda doit être reconnecté (jeton périmé /
// permission incomplète). Un seul clic : déconnecte puis rouvre l'autorisation
// Google dans un popup, et relance la synchro à la fermeture.
export default function ReconnectCalendarBanner({ onReconnected }) {
  const [working, setWorking] = useState(false);

  const reconnect = async () => {
    setWorking(true);
    // Ouvrir le popup IMMÉDIATEMENT pour qu'il ne soit pas bloqué.
    const popup = window.open("about:blank", "_blank", "width=520,height=640");
    try {
      await base44.connectors.disconnectAppUser(CALENDAR_CONNECTOR_ID);
      const url = await base44.connectors.connectAppUser(CALENDAR_CONNECTOR_ID);
      if (popup) popup.location.href = url;
      else window.open(url, "_blank");
    } catch {
      if (popup) popup.close();
      setWorking(false);
      return;
    }
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setWorking(false);
        onReconnected?.();
      }
    }, 500);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-900 flex-1 min-w-[200px]">
        Votre agenda Google doit être reconnecté pour autoriser la synchronisation.
        Cliquez ci-contre, validez sur l'écran Google, c'est tout.
      </p>
      <Button onClick={reconnect} disabled={working} className="gap-2 bg-amber-600 hover:bg-amber-700">
        {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Reconnecter Google Agenda
      </Button>
    </div>
  );
}