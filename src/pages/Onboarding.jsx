import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, Calendar, Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAccessGrant } from "@/hooks/useAccessGrant";

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { grant, isLoading } = useAccessGrant();
  const [busy, setBusy] = useState(null); // 'calendar' | 'gmail' | null

  const calendarDone = !!grant?.calendar_connected;
  const gmailDone = !!grant?.gmail_connected;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["accessGrant"] });

  const connectCalendar = async () => {
    setBusy("calendar");
    await base44.connectors.authorize("googlecalendar", {
      scopes: ["https://www.googleapis.com/auth/calendar.events", "email"],
    });
    if (grant) await base44.entities.AccessGrant.update(grant.id, { calendar_connected: true });
    await refresh();
    setBusy(null);
  };

  const connectGmail = async () => {
    setBusy("gmail");
    await base44.connectors.authorize("gmail", {
      scopes: ["https://www.googleapis.com/auth/gmail.send", "email"],
    });
    if (grant) await base44.entities.AccessGrant.update(grant.id, { gmail_connected: true });
    await refresh();
    setBusy(null);
  };

  const allDone = calendarDone && gmailDone;

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/40 px-5 py-10 font-body">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-xl border border-border/60 p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/20 mb-4">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-foreground">Connectez vos comptes Google</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Reliez votre Google Calendar et votre Gmail pour activer la synchronisation
            de l'agenda et l'envoi automatique des e-mails.
          </p>
        </div>

        <div className="space-y-4">
          <StepCard
            icon={Calendar}
            title="Google Calendar"
            text="Synchronise vos rendez-vous avec votre agenda Google."
            done={calendarDone}
            busy={busy === "calendar"}
            onConnect={connectCalendar}
          />
          <StepCard
            icon={Mail}
            title="Gmail"
            text="Envoie les rappels, avis et relances depuis votre adresse."
            done={gmailDone}
            busy={busy === "gmail"}
            onConnect={connectGmail}
          />
        </div>

        <Button
          disabled={!allDone || isLoading}
          onClick={() => navigate("/", { replace: true })}
          className="w-full mt-8 h-11 rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          Accéder à mon espace <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function StepCard({ icon: Icon, title, text, done, busy, onConnect }) {
  return (
    <div className="rounded-2xl border border-border p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-display font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{text}</p>
      </div>
      {done ? (
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 shrink-0">
          <CheckCircle2 className="w-4 h-4" /> Connecté
        </div>
      ) : (
        <Button onClick={onConnect} disabled={busy} size="sm" className="shrink-0 bg-blue-600 hover:bg-blue-700">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connecter"}
        </Button>
      )}
    </div>
  );
}