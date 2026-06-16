import { MessageSquare, Lock } from "lucide-react";

export default function SmsReminderSettings() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 opacity-90">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-5 h-5 text-muted-foreground" />
        <h2 className="font-display font-semibold text-lg">Rappel SMS</h2>
        <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          <Lock className="w-3 h-3" /> À venir
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        L'envoi de rappels par SMS sera disponible prochainement, exclusivement pour les forfaits
        professionnels.
      </p>
    </div>
  );
}