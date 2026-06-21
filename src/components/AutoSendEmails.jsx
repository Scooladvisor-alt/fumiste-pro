import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Déclenche, une fois par jour à l'ouverture du logiciel, l'envoi des e-mails
// (rappels / avis / relances) depuis le Gmail connecté de l'utilisateur courant.
// Anti-doublon : on ne relance pas si déjà fait aujourd'hui (auto_send_last_run).
export default function AutoSendEmails() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const list = await base44.entities.ReminderSettings.list();
        const settings = list[0];
        // Pas de réglages encore, ou déjà envoyé aujourd'hui → on ne fait rien.
        if (!settings || settings.auto_send_last_run === today) return;

        const res = await base44.functions.invoke("sendMyEmails", {});
        // Si Gmail non connecté, on n'enregistre pas la date pour réessayer plus tard.
        if (res.data?.error === "gmail_not_connected") return;

        await base44.entities.ReminderSettings.update(settings.id, {
          auto_send_last_run: today,
        });
      } catch {
        // Silencieux : l'envoi manuel reste disponible dans les réglages.
      }
    })();
  }, []);

  return null;
}