import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const LINKS = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Tarifs", href: "#pricing" },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">Fumiste Pro</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden sm:inline-flex text-slate-700" onClick={() => base44.auth.redirectToLogin()}>
            Connexion
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" asChild>
            <a href="#pricing">Choisir une offre</a>
          </Button>
        </div>
      </div>
    </header>
  );
}