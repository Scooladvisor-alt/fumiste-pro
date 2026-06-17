import { Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Julien M.", role: "Ramoneur, Seine-et-Marne", text: "Depuis Fumiste Pro, je récupère 3 à 4 avis Google par semaine sans rien faire. Mon planning ne désemplit plus." },
  { name: "Sandrine L.", role: "Gérante, entreprise de fumisterie", text: "Les relances ramonage automatiques nous ont fait gagner un nombre fou de rendez-vous chaque année. Indispensable." },
  { name: "Karim B.", role: "Artisan fumiste", text: "Plus aucun client n'oublie son rendez-vous. Les rappels J-2 ont divisé mes déplacements pour rien par deux." },
];

export default function LandingTestimonials() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900">
            Ils ont automatisé leur quotidien
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed">"{t.text}"</p>
              <div className="mt-5">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}