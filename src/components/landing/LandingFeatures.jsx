import { Bell, Star, Flame, Droplets, CalendarCheck, Users, LayoutDashboard } from "lucide-react";

const FEATURES = [
  { icon: Bell, title: "Rappels automatiques J-2", text: "Chaque client reçoit un e-mail de rappel 2 jours avant son intervention. Fini les oublis et les déplacements pour rien." },
  { icon: Star, title: "Demandes d'avis Google", text: "Le lendemain de l'intervention, un e-mail invite vos clients satisfaits à laisser un avis Google. Votre réputation grandit toute seule." },
  { icon: Flame, title: "Relances ramonage annuelles", text: "Dès qu'un ramonage date d'un an, votre client est relancé automatiquement. L'obligation légale devient une opportunité de revenu." },
  { icon: Droplets, title: "Relances test d'étanchéité", text: "Suivi automatique des tests d'étanchéité tous les 3 ans, pour ne jamais passer à côté d'une échéance." },
  { icon: CalendarCheck, title: "Agenda synchronisé", text: "Votre agenda est synchronisé en temps réel avec Google Calendar. Vos rendez-vous, partout, à jour." },
  { icon: Users, title: "Fiches clients complètes", text: "Coordonnées, historique d'interventions et dates clés réunis sur une fiche claire et modifiable en un clic." },
  { icon: LayoutDashboard, title: "Tableau de bord", text: "Une tour de contrôle qui affiche en un coup d'œil les communications envoyées et vos prochains rendez-vous." },
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
            Fumiste Pro automatise les tâches répétitives pour que vous puissiez vous concentrer sur votre métier.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
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