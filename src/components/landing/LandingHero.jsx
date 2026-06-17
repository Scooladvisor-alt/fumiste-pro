import { ArrowRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const POINTS = ["Sans carte bancaire", "Mise en place en 5 min", "Sans engagement"];

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="max-w-3xl mx-auto px-5 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-100 text-blue-700 text-sm font-medium mb-7 shadow-sm">
          <Sparkles className="w-4 h-4" />
          Le logiciel des ramoneurs &amp; fumistes
        </div>

        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight text-slate-900 leading-[1.1]">
          Vos rappels, avis Google et relances ramonage,{" "}
          <span className="text-blue-600">100% automatiques.</span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto">
          Fumiste Pro gère votre agenda, prévient vos clients avant chaque intervention, récolte vos avis Google
          et relance automatiquement les ramonages annuels.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-7 text-base shadow-lg shadow-blue-200"
            onClick={() => base44.auth.redirectToLogin("/app")}
          >
            Obtenir un accès <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl h-12 px-7 text-base border-slate-300" asChild>
            <a href="#features">Voir les fonctionnalités</a>
          </Button>
        </div>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          {POINTS.map((p) => (
            <li key={p} className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-blue-600" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}