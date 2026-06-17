import { AlertTriangle, Flame, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getClientsToFollowUp, formatDateFr } from "@/lib/followupStatus";

// Section affichant les clients dont un entretien obligatoire est échu :
// ramonage (> 1 an) ou test d'étanchéité (> 3 ans).
export default function FollowUpSection({ clients }) {
  const rows = getClientsToFollowUp(clients);

  if (rows.length === 0) return null;

  return (
    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h2 className="font-display font-semibold text-amber-900">
          À relancer — entretiens obligatoires échus
        </h2>
        <Badge className="ml-auto bg-amber-600 hover:bg-amber-600 text-white">{rows.length}</Badge>
      </div>

      <div className="divide-y divide-amber-200/70">
        {rows.map(({ client, ramonage, etancheite }) => (
          <div key={client.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
            <span className="font-medium text-amber-950 min-w-[140px]">{client.full_name}</span>
            {client.phone && <span className="text-amber-800/80">{client.phone}</span>}

            {ramonage.overdue && (
              <span className="inline-flex items-center gap-1.5 text-amber-800">
                <Flame className="w-3.5 h-3.5" />
                {ramonage.never
                  ? "Ramonage jamais effectué"
                  : `Ramonage depuis le ${formatDateFr(client.last_ramonage_date)}`}
              </span>
            )}

            {etancheite.overdue && (
              <span className="inline-flex items-center gap-1.5 text-cyan-800">
                <Droplets className="w-3.5 h-3.5" />
                {`Étanchéité depuis le ${formatDateFr(client.last_etancheite_date)}`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}