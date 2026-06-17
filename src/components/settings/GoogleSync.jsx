import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

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
    await base44.connectors.authorize("googlecalendar", {
      scopes: ["https://www.googleapis.com/auth/calendar.events", "email"],
    });
    await check();
    setConnecting(false);
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
        <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4" />
          Connecté et synchronisé
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