import { Calendar, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GoogleSync() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Calendar className="w-[18px] h-[18px]" />
        </div>
        <h2 className="font-display font-bold text-lg">Google Calendar</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Synchronisez automatiquement vos rendez-vous avec votre agenda Google
        (bidirectionnel).
      </p>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() =>
          toast.info(
            "La connexion Google Calendar sera activée prochainement. Confirmez-moi quand vous souhaitez la brancher."
          )
        }
      >
        <Link2 className="w-4 h-4" /> Connecter Google Calendar
      </Button>
    </div>
  );
}