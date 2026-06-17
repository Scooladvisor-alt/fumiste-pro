import { Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Affiche une enveloppe quand une relance a été envoyée pour cette intervention.
// Visible uniquement si une relance a été envoyée APRÈS la date d'intervention,
// donc elle disparaît automatiquement dès qu'un nouvel événement met à jour la date.
export default function FollowupSentIcon({ interventionDate, sentDate }) {
  if (!interventionDate || !sentDate || sentDate < interventionDate) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-primary">
            <Mail className="w-4 h-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Relance envoyée le {new Date(sentDate).toLocaleDateString("fr-FR")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}