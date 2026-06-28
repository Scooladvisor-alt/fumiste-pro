import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Vérifie si l'utilisateur a terminé l'onboarding.
// status: "loading" | "done" | "pending"
export function useOnboardingStatus() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.ReminderSettings.list();
        const done = list.length > 0 && list[0].onboarding_completed === true;
        setStatus(done ? "done" : "pending");
      } catch {
        setStatus("pending");
      }
    })();
  }, []);

  return status;
}