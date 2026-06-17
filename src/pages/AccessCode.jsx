import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useAccessGrant } from "@/hooks/useAccessGrant";

export default function AccessCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isUnlocked, isLoading } = useAccessGrant();

  // Plan choisi sur la landing (?plan=simple|sms)
  const plan = new URLSearchParams(location.search).get("plan") === "sms" ? "sms" : "simple";

  useEffect(() => {
    if (!isLoading && isUnlocked) navigate("/", { replace: true });
  }, [isLoading, isUnlocked, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("unlockAccess", { code, plan });
      if (res.data?.ok) {
        await queryClient.invalidateQueries({ queryKey: ["accessGrant"] });
        navigate("/", { replace: true });
      } else {
        setError("Code d'accès invalide. Vérifiez votre code et réessayez.");
      }
    } catch {
      setError("Une erreur est survenue. Réessayez dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/40 px-5 font-body">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/60 p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/20 mb-4">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-foreground">Activez votre espace</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Saisissez le code d'accès reçu après votre abonnement pour déverrouiller Fumiste Pro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code d'accès"
              className="pl-9 h-11 text-center tracking-widest font-medium"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="submit" disabled={submitting || !code.trim()} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Déverrouiller mon espace"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Offre sélectionnée : <span className="font-semibold text-foreground">{plan === "sms" ? "Pro + SMS (30€/mois)" : "Simple (19€/mois)"}</span>
        </p>
      </div>
    </div>
  );
}