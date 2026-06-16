import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Phone, Mail, MapPin, Pencil, Trash2, Calendar, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useAppointments, useRefreshData } from "@/hooks/useData";

export default function ClientDetail({ client, onClose, onEdit }) {
  const { data: appointments } = useAppointments();
  const refresh = useRefreshData();

  if (!client) return null;

  const related = appointments
    .filter((a) => a.client_id === client.id)
    .sort((a, b) => new Date(b.start) - new Date(a.start));

  const handleDelete = async () => {
    await base44.entities.Client.delete(client.id);
    refresh();
    onClose();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-lg truncate">{client.full_name}</h2>
          {client.city && <p className="text-sm text-muted-foreground">{client.city}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-5 space-y-3">
        <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm hover:text-primary">
          <Phone className="w-4 h-4 text-muted-foreground" /> {client.phone}
        </a>
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm hover:text-primary">
            <Mail className="w-4 h-4 text-muted-foreground" /> {client.email}
          </a>
        )}
        {client.city && (
          <p className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" /> {client.city}
          </p>
        )}
        {client.notes && (
          <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3 mt-2 whitespace-pre-wrap">
            {client.notes}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(client)}>
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </Button>
        </div>
      </div>

      <div className="px-5 pb-5 flex-1 overflow-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Rendez-vous ({related.length})
        </p>
        <div className="space-y-2">
          {related.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun rendez-vous.</p>
          )}
          {related.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
              <span className="w-1.5 h-9 rounded-full" style={{ backgroundColor: a.color || "#3b82f6" }} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.intervention_type}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(a.start), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}