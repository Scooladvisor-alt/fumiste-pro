import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Récupère (ou crée) l'AccessGrant de l'utilisateur courant.
// L'utilisateur est identifié par sa connexion Google : à la première visite
// on crée son AccessGrant, puis l'onboarding lui demande de connecter
// son Google Calendar et son Gmail.
export function useAccessGrant() {
  const query = useQuery({
    queryKey: ["accessGrant"],
    queryFn: async () => {
      const list = await base44.entities.AccessGrant.list();
      if (list[0]) return list[0];
      return await base44.entities.AccessGrant.create({});
    },
  });

  const grant = query.data;
  const needsOnboarding = !(grant?.calendar_connected && grant?.gmail_connected);

  return { grant, needsOnboarding, ...query };
}