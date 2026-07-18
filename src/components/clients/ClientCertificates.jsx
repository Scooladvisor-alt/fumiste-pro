import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileCheck, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ClientCertificates({ client, open, onOpenChange }) {
  const [certs, setCerts] = useState(null);

  useEffect(() => {
    if (!open || !client) return;
    setCerts(null);
    base44.entities.RamonageCertificate.filter({ client_id: client.id }, "-created_date").then(setCerts);
  }, [open, client]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Certificats de ramonage — {client?.full_name}
          </DialogTitle>
        </DialogHeader>

        {!certs ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-secondary border-t-primary rounded-full animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun certificat enregistré pour ce client.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {certs.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileCheck className="w-[18px] h-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{cert.certificate_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.intervention_date
                      ? format(new Date(cert.intervention_date), "d MMMM yyyy", { locale: fr })
                      : "—"}
                    {" · "}
                    <span
                      className={
                        cert.conforme === "non_conforme" ? "text-red-600" : "text-green-600"
                      }
                    >
                      {cert.conforme === "non_conforme" ? "Non conforme" : "Conforme"}
                    </span>
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link to={`/certificat?id=${cert.id}`}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Voir
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}