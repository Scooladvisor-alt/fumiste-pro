import { Flame } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-lg text-white">Fumiste Pro</span>
            </div>
            <p className="text-sm">Le logiciel qui automatise les rappels, avis et relances des ramoneurs et fumistes.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-semibold text-white mb-3">Produit</p>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
                <li><a href="#how" className="hover:text-white">Comment ça marche</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Entreprise</p>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">À propos</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Légal</p>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-center">
          © {new Date().getFullYear()} Fumiste Pro. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}