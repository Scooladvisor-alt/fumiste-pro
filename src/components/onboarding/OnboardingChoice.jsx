import { cn } from "@/lib/utils";

// Carte de choix réutilisable (type QCM) pour l'onboarding.
export default function OnboardingChoice({ label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border-2 p-4 transition-all",
        selected
          ? "border-ember bg-accent shadow-md shadow-ember/10"
          : "border-border bg-card hover:border-ember/40"
      )}
    >
      <p className="font-display font-semibold text-base">{label}</p>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </button>
  );
}