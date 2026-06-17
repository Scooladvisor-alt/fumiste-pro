import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Récupère l'AccessGrant de l'utilisateur courant (un seul par utilisateur via RLS).
export function useAccessGrant() {
  const query = useQuery({
    queryKey: ["accessGrant"],
    queryFn: async () => {
      const list = await base44.entities.AccessGrant.list();
      return list[0] || null;
    },
  });

  const grant = query.data;
  const isUnlocked = !!grant?.unlocked_at;
  const needsOnboarding = isUnlocked && !(grant?.calendar_connected && grant?.gmail_connected);

  return { grant, isUnlocked, needsOnboarding, ...query };
}