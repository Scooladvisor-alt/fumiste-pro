import { Bell, Star, Flame, Droplets, MessageSquare, Send } from "lucide-react";

const TYPES = [
  { key: "rappel", label: "Rappels d'intervention", icon: Bell, accent: "bg-orange-100 text-orange-600" },
  { key: "avis", label: "Demandes d'avis Google", icon: Star, accent: "bg-amber-100 text-amber-600" },
  { key: "relance_ramonage", label: "Relances ramonage", icon: Flame, accent: "bg-red-100 text-red-600" },
  { key: "relance_etancheite", label: "Relances test d'étanchéité", icon: Droplets, accent: "bg-rose-100 text-rose-600" },
  { key: "sms", label: "SMS envoyés", icon: MessageSquare, accent: "bg-stone-200 text-stone-700" },
];

export default function CommunicationStats({ counts, total }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ember to-ember-deep text-white flex items-center justify-center shadow-md shadow-ember/30">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Communications envoyées</p>
          <p className="font-display font-bold text-2xl leading-none">{total}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {TYPES.map(({ key, label, icon: Icon, accent }) => (
          <div key={key} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-xl leading-none">{counts[key] || 0}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}