import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_BG = "https://media.base44.com/images/public/6a317a4a4d788d4ef9ab684e/b669a7374_generated_image.png";
const MOCKUP = "https://media.base44.com/images/public/6a317a4a4d788d4ef9ab684e/c24745fde_generated_image.png";

export default function LandingHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Le logiciel des ramoneurs &amp; fumistes
        </div>

        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
          Vos rappels, avis Google et relances ramonage,{" "}
          <span className="text-blue-600">100% automatiques.</span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          Fumiste Pro gère votre agenda, prévient vos clients avant chaque intervention, récolte vos avis Google
          et relance automatiquement les ramonages annuels. Vous gagnez du temps, vos clients reviennent.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-7 text-base" asChild>
            <a href="#pricing">Choisir une offre <ArrowRight className="w-4 h-4" /></a>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl h-12 px-7 text-base border-slate-300" asChild>
            <a href="#features">Voir les fonctionnalités</a>
          </Button>
        </div>

        <div className="mt-14 relative">
          <div className="absolute -inset-4 bg-blue-600/10 blur-3xl rounded-full" />
          <img
            src={MOCKUP}
            alt="Aperçu du logiciel Fumiste Pro"
            className="relative w-full max-w-4xl mx-auto rounded-2xl shadow-2xl border border-slate-200"
          />
        </div>
      </div>
    </section>
  );
}