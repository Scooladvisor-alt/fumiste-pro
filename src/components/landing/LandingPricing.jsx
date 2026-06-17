import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const PLANS = [
  {
    name: "Essentiel",
    price: "29",
    desc: "Pour l'artisan qui démarre.",
    features: ["Jusqu'à 200 clients", "Rappels automatiques J-2", "Demandes d'avis Google", "Agenda synchronisé", "Support par e-mail"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "49",
    desc: "Le choix des fumistes établis.",
    features: ["Clients illimités", "Tout l'Essentiel", "Relances ramonage & étanchéité", "Tableau de bord complet", "Support prioritaire"],
    highlight: true,
  },
  {
    name: "Entreprise",
    price: "99",
    desc: "Pour les équipes multi-techniciens.",
    features: ["Tout le Pro", "Plusieurs utilisateurs", "Personnalisation des e-mails", "Accompagnement dédié"],
    highlight: false,
  },
];

export default function LandingPricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900">Des tarifs simples</h2>
          <p className="mt-4 text-slate-600">Sans engagement. Essai gratuit de 14 jours sur tous les plans.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 border ${
                p.highlight ? "border-blue-600 shadow-xl shadow-blue-100 relative" : "border-slate-200"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Le plus choisi
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
                onClick={() => base44.auth.redirectToLogin()}
              >
                Commencer
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