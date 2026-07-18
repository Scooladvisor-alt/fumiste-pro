import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, XCircle } from "lucide-react";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function CertificatView({ cert }) {
  const dateStr = cert.intervention_date
    ? format(new Date(cert.intervention_date), "EEEE d MMMM yyyy", { locale: fr })
    : "";

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8 space-y-6">
      {/* En-tête */}
      <div className="text-center border-b border-border pb-5">
        <h1 className="font-display font-extrabold text-2xl tracking-tight">
          CERTIFICAT DE RAMONAGE
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          N° {cert.certificate_number}
        </p>
      </div>

      {/* Entreprise & client */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Entreprise
          </h3>
          <Row label="Nom" value={cert.company_name} />
          <Row label="Coordonnées" value={cert.company_details} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Client
          </h3>
          <Row label="Nom" value={cert.client_name} />
          <Row label="Adresse" value={cert.client_address} />
          <Row label="E-mail" value={cert.client_email} />
          <Row label="Téléphone" value={cert.client_phone} />
        </div>
      </div>

      {/* Intervention */}
      <div className="rounded-xl bg-secondary p-4 space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Intervention
        </h3>
        <Row label="Date" value={dateStr} />
        <Row label="Heure" value={cert.intervention_time} />
      </div>

      {/* Texte standard */}
      <p className="text-sm leading-relaxed text-foreground/90">
        Je soussigné(e), représentant l'entreprise{" "}
        <strong>{cert.company_name || "—"}</strong>, certifie avoir procédé ce jour au
        ramonage du conduit de fumée du client désigné ci-dessus, conformément aux
        dispositions du Règlement Sanitaire Départemental en vigueur. Le présent
        certificat atteste de la vacuité du conduit sur toute sa longueur ainsi que
        de son état de fonctionnement au moment de l'intervention.
      </p>

      {/* Résultat & observations (renseignés à la signature) */}
      {cert.locked && (
        <div className="space-y-4">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
              cert.conforme === "non_conforme"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {cert.conforme === "non_conforme" ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {cert.conforme === "non_conforme" ? "Non conforme" : "Conforme"}
          </div>

          {cert.observations && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Observations
              </h3>
              <p className="text-sm whitespace-pre-wrap">{cert.observations}</p>
            </div>
          )}
          {cert.non_conformites && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Non-conformités
              </h3>
              <p className="text-sm whitespace-pre-wrap">{cert.non_conformites}</p>
            </div>
          )}
          {cert.commentaires && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Commentaires
              </h3>
              <p className="text-sm whitespace-pre-wrap">{cert.commentaires}</p>
            </div>
          )}

          {/* Signature */}
          {cert.signature_url && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Signature du client
              </h3>
              <img
                src={cert.signature_url}
                alt="Signature du client"
                className="h-28 object-contain"
              />
              {cert.signed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Signé le{" "}
                  {format(new Date(cert.signed_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}