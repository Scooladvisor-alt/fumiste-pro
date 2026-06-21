import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Déclenche, au plus une fois par jour à l'ouverture du logiciel, l'envoi des
// e-mails (rappels / avis / relances) depuis le Gmail connecté de l'utilisateur.
// La protection "max 1x/jour" est garantie côté serveur (auto_send_last_run) :
// même si ce composant se remonte, le serveur refusera un 2e envoi du jour.
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
        // Pas encore de réglages, ou déjà envoyé aujourd'hui → on ne fait rien.
        if (!settings || settings.auto_send_last_run === today) return;

        // auto:true → le serveur applique la limite d'un envoi par jour.
        await base44.functions.invoke("sendMyEmails", { auto: true });
      } catch {
        // Silencieux : l'envoi manuel reste disponible dans les réglages.
      }
    })();
  }, []);

  return null;
}