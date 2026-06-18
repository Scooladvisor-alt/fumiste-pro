import { Bell, Star, Flame, Droplets, CalendarCheck, Users, LayoutDashboard } from "lucide-react";

const FEATURES = [
  {
    icon: Bell,
    title: "Rappels automatiques J-2",
    text: "Un e-mail de rappel part 2 jours avant chaque intervention. Plus d'oublis ni de déplacements pour rien.",
  },
  {
    icon: Star,
    title: "Avis Google automatiques",
    text: "Le lendemain de l'intervention, vos clients sont invités à laisser un avis. Votre réputation grandit seule.",
  },
  {
    icon: Flame,
    title: "Relances ramonage",
    text: "Un an après le dernier ramonage, le client est relancé automatiquement. L'obligation devient du revenu.",
  },
  {
    icon: Droplets,
    title: "Relances étanchéité",
    text: "Suivi automatique des tests d'étanchéité tous les 3 ans. Aucune échéance ne passe à la trappe.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda synchronisé",
    text: "Vos rendez-vous synchronisés en temps réel avec Google Calendar. Partout, toujours à jour.",
  },
  {
    icon: Users,
    title: "Fiches clients claires",
    text: "Coordonnées, historique et dates clés réunis sur une fiche modifiable en un clic.",
  },
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    text: "Une tour de contrôle : communications envoyées et prochains rendez-vous en un coup d'œil.",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900">
            Tout ce qu'il faut pour fidéliser vos clients
          </h2>
          <p className="mt-4 text-slate-600">
            Fumiste Pro automatise les tâches répétitives pour que vous gardiez votre temps pour le métier.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 p-6 hover:border-ember/40 hover:shadow-lg hover:shadow-ember/10 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-ember flex items-center justify-center mb-4 group-hover:bg-gradient-to-br group-hover:from-ember group-hover:to-ember-deep group-hover:text-white transition-all">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}