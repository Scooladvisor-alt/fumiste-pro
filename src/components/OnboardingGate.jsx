import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

// Bloque l'accès à l'app tant que l'onboarding n'est pas terminé.
export default function OnboardingGate() {
  const status = useOnboardingStatus();

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#fbf7f4]">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    );
  }

  if (status === "pending") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}