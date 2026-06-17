import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function LandingCTA() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-5">
        <div className="rounded-3xl bg-blue-600 px-8 py-14 text-center">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white">
            Prêt à automatiser votre activité ?
          </h2>
          <p className="mt-4 text-blue-100 max-w-xl mx-auto">
            Rejoignez les fumistes qui gagnent du temps et fidélisent leurs clients avec Fumiste Pro. Essai gratuit, sans carte bancaire.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-white text-blue-700 hover:bg-blue-50 rounded-xl h-12 px-7 text-base"
            onClick={() => base44.auth.redirectToLogin()}
          >
            Essayer gratuitement <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}