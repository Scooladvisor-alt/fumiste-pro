import { Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const PLANS = [
  {
    plan: "simple",
    name: "Simple",
    price: "19",
    desc: "Tout pour automatiser votre activité.",
    features: [
      "Clients illimités",
      "Rappels automatiques J-2",
      "Demandes d'avis Google",
      "Relances ramonage & étanchéité",
      "Agenda synchronisé Google Calendar",
      "Tableau de bord complet",
    ],
    highlight: false,
    badge: null,
  },
  {
    plan: "sms",
    name: "Pro + SMS",
    price: "30",
    desc: "Le Simple, plus les rappels par SMS.",
    features: [
      "Tout l'offre Simple",
      "100 SMS inclus par mois",
      "Rappels clients par SMS",
      "Support prioritaire",
    ],
    highlight: true,
    badge: "Option SMS bientôt disponible",
  },
];

export default function LandingPricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900">Des tarifs simples</h2>
          <p className="mt-4 text-slate-600">Sans engagement. Choisissez l'offre qui vous correspond.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {PLANS.map((p) => (
            <div
              key={p.plan}
              className={`rounded-2xl p-7 border ${
                p.highlight ? "border-blue-600 shadow-xl shadow-blue-100 relative" : "border-slate-200"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  <MessageSquare className="w-3 h-3" /> {p.badge}
                </span>
              )}
              <h3 className="font-display font-bold text-xl text-slate-900">{p.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display font-extrabold text-4xl text-slate-900">{p.price}€</span>
                <span className="text-slate-500 mb-1">/ mois</span>
              </div>
              <Button
                className={`w-full mt-5 rounded-xl ${p.highlight ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800"}`}
                onClick={() => base44.auth.redirectToLogin("/app")}
              >
                Obtenir un accès
              </Button>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}