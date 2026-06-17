import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAccessGrant } from "@/hooks/useAccessGrant";

// Protège l'espace logiciel : tant que le code d'accès n'est pas validé -> /code,
// puis tant que les comptes Google ne sont pas connectés -> /onboarding.
export default function AccessGuard() {
  const location = useLocation();
  const { isUnlocked, needsOnboarding, isLoading } = useAccessGrant();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) return <Navigate to="/code" replace />;
  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}