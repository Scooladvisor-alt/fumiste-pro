import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ChevronRight, ChevronLeft, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OnboardingChoice from "@/components/onboarding/OnboardingChoice";
import { EMAIL_DEFAULTS } from "@/lib/emailDefaults";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Valeurs configurées pendant l'onboarding
  const [companyName, setCompanyName] = useState("");
  const [dailyHour, setDailyHour] = useState(8);
  const [daysBefore, setDaysBefore] = useState(2);
  const [reviewDaysAfter, setReviewDaysAfter] = useState(1);
  const [followupEnabled, setFollowupEnabled] = useState(true);
  const [followupMonths, setFollowupMonths] = useState(12);

  // Charge / crée l'enregistrement de réglages. Si déjà onboardé, on redirige.
  useEffect(() => {
    (async () => {
      const list = await base44.entities.ReminderSettings.list();
      if (list.length > 0) {
        const s = list[0];
        if (s.onboarding_completed) {
          navigate("/app", { replace: true });
          return;
        }
        setSettingsId(s.id);
        setCompanyName(s.company_name || "");
        setDailyHour(s.daily_send_hour ?? 8);
        setDaysBefore(s.days_before ?? 2);
        setReviewDaysAfter(s.review_days_after ?? 1);
      } else {
        const created = await base44.entities.ReminderSettings.create({ onboarding_completed: false });
        setSettingsId(created.id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STEPS = [
    {
      title: "Votre entreprise",
      subtitle: "Comment s'appelle votre entreprise ? Elle apparaîtra dans votre tableau de bord.",
      valid: companyName.trim().length > 0,
      content: (
        <div>
          <Label className="mb-2 block">Nom de l'entreprise</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex : Ramonage Dupont"
            className="text-base"
            autoFocus
          />
        </div>
      ),
    },
    {
      title: "Heure de réveil quotidienne",
      subtitle:
        "Chaque matin à cette heure, le logiciel analyse votre agenda et envoie automatiquement les e-mails (rappels, avis, relances).",
      valid: true,
      content: (
        <div>
          <Label className="mb-2 block">Heure d'envoi chaque jour</Label>
          <Select value={String(dailyHour)} onValueChange={(v) => setDailyHour(Number(v))}>
            <SelectTrigger className="w-40 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      title: "Rappels d'intervention",
      subtitle: "Combien de jours avant le rendez-vous voulez-vous envoyer le rappel au client ?",
      valid: true,
      content: (
        <div className="space-y-2.5">
          {[1, 2, 3].map((d) => (
            <OnboardingChoice
              key={d}
              label={d === 1 ? "1 jour avant" : `${d} jours avant`}
              selected={daysBefore === d}
              onClick={() => setDaysBefore(d)}
            />
          ))}
        </div>
      ),
    },
    {
      title: "Demandes d'avis Google",
      subtitle: "Combien de jours après l'intervention voulez-vous demander un avis au client ?",
      valid: true,
      content: (
        <div className="space-y-2.5">
          {[1, 2, 3].map((d) => (
            <OnboardingChoice
              key={d}
              label={d === 1 ? "1 jour après" : `${d} jours après`}
              selected={reviewDaysAfter === d}
              onClick={() => setReviewDaysAfter(d)}
            />
          ))}
        </div>
      ),
    },
    {
      title: "Relances ramonage",
      subtitle:
        "À quelle fréquence relancer vos clients pour un nouveau ramonage ? (Vous pourrez le modifier plus tard.)",
      valid: true,
      content: (
        <div className="space-y-2.5">
          <OnboardingChoice
            label="Tous les ans"
            description="Relance 12 mois après le dernier ramonage (obligation légale annuelle)."
            selected={followupEnabled && followupMonths === 12}
            onClick={() => {
              setFollowupEnabled(true);
              setFollowupMonths(12);
            }}
          />
          <OnboardingChoice
            label="Tous les 6 mois"
            description="Relance 6 mois après le dernier ramonage."
            selected={followupEnabled && followupMonths === 6}
            onClick={() => {
              setFollowupEnabled(true);
              setFollowupMonths(6);
            }}
          />
          <OnboardingChoice
            label="Ne pas envoyer de relances"
            description="Vous pourrez les activer plus tard dans les réglages."
            selected={!followupEnabled}
            onClick={() => setFollowupEnabled(false)}
          />
        </div>
      ),
    },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (!current.valid) return;
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  const finish = async () => {
    setSaving(true);
    await base44.entities.ReminderSettings.update(settingsId, {
      ...EMAIL_DEFAULTS,
      company_name: companyName.trim(),
      daily_send_hour: dailyHour,
      days_before: daysBefore,
      review_days_after: reviewDaysAfter,
      review_enabled: true,
      followup_enabled: followupEnabled,
      followup_months: followupMonths,
      onboarding_completed: true,
    });
    navigate("/app", { replace: true });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#fbf7f4]">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7f4] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* En-tête marque */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ember-glow via-ember to-ember-deep flex items-center justify-center shadow-lg shadow-ember/40">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <p className="font-display font-extrabold text-xl tracking-tight">Fumiste Pro</p>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-ember" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-ember font-bold mb-2">
            Étape {step + 1} / {STEPS.length}
          </p>
          <h1 className="font-display font-extrabold text-2xl mb-1.5">{current.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{current.subtitle}</p>

          <div className="mb-8">{current.content}</div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>
            <Button onClick={next} disabled={!current.valid || saving} className="gap-1.5 min-w-32">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLast ? (
                <>
                  <Check className="w-4 h-4" /> Terminer
                </>
              ) : (
                <>
                  Continuer <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}