import { Calendar, CheckCircle2 } from "lucide-react";

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
        Vos rendez-vous clients sont synchronisés automatiquement vers votre
        agenda Google. Toute création, modification ou suppression est
        répercutée instantanément.
      </p>
      <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
        <CheckCircle2 className="w-4 h-4" />
        Connecté et synchronisé
      </div>
    </div>
  );
}