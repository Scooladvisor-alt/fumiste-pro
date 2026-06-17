const STEPS = [
  { n: "1", title: "Ajoutez vos clients & rendez-vous", text: "Importez vos clients et planifiez vos interventions dans l'agenda. Tout se synchronise avec Google Calendar." },
  { n: "2", title: "Le logiciel travaille pour vous", text: "Chaque matin, Fumiste Pro envoie automatiquement les rappels, demandes d'avis et relances ramonage aux bons clients." },
  { n: "3", title: "Suivez vos résultats", text: "Le tableau de bord vous montre tout ce qui a été envoyé et vos prochains rendez-vous. Vous gardez le contrôle." },
];

export default function LandingHowItWorks() {
  return (
    <section id="how" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900">Comment ça marche</h2>
          <p className="mt-4 text-slate-600">Mis en place en quelques minutes, actif pour toujours.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto mb-5">
                {s.n}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}