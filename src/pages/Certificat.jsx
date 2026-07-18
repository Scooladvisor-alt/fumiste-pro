import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, PenLine } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import CertificatView from "@/components/certificat/CertificatView";
import CertificatForm from "@/components/certificat/CertificatForm";
import SignaturePad from "@/components/certificat/SignaturePad";

export default function Certificat() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get("appointment_id");

  const padRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null); // certificat signé et verrouillé
  const [draft, setDraft] = useState(null); // données préremplies
  const [form, setForm] = useState({
    conforme: "conforme",
    observations: "",
    non_conformites: "",
    commentaires: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }
    (async () => {
      const [existing] = await base44.entities.RamonageCertificate.filter({
        appointment_id: appointmentId,
      });
      if (existing) {
        setCert(existing);
        setLoading(false);
        return;
      }
      const appt = await base44.entities.Appointment.get(appointmentId);
      const client = appt.client_id
        ? await base44.entities.Client.get(appt.client_id).catch(() => null)
        : null;
      const [settings] = await base44.entities.ReminderSettings.list();
      const me = await base44.auth.me().catch(() => null);
      const all = await base44.entities.RamonageCertificate.list();
      const start = new Date(appt.start);
      setDraft({
        certificate_number: `RAM-${start.getFullYear()}-${String(all.length + 1).padStart(4, "0")}`,
        appointment_id: appointmentId,
        client_id: appt.client_id || "",
        client_name: client?.full_name || "",
        client_address: client?.city || "",
        client_email: client?.email || "",
        client_phone: client?.phone || "",
        intervention_date: format(start, "yyyy-MM-dd"),
        intervention_time: format(start, "HH:mm"),
        company_name: settings?.company_name || "",
        company_details: me?.email || "",
      });
      setLoading(false);
    })();
  }, [appointmentId]);

  const handleSign = async () => {
    setError("");
    if (padRef.current.isEmpty()) {
      setError("La signature du client est requise pour valider le certificat.");
      return;
    }
    setSaving(true);
    const blob = await padRef.current.getBlob();
    const file = new File([blob], "signature.png", { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const created = await base44.entities.RamonageCertificate.create({
      ...draft,
      ...form,
      signature_url: file_url,
      signed_at: new Date().toISOString(),
      locked: true,
    });
    setCert(created);
    setSaving(false);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointmentId || (!cert && !draft)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">Rendez-vous introuvable.</p>
        <Button asChild variant="outline">
          <Link to="/agenda">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour à l'agenda
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/agenda">
            <ArrowLeft className="w-4 h-4 mr-1" /> Agenda
          </Link>
        </Button>
        {cert && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary rounded-full px-3 py-1.5">
            <Lock className="w-3.5 h-3.5" /> Certificat signé et verrouillé
          </span>
        )}
      </div>

      <CertificatView cert={cert || draft} />

      {!cert && (
        <>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <h2 className="font-display font-bold text-lg">À compléter avant signature</h2>
            <CertificatForm form={form} onChange={setForm} />
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <h2 className="font-display font-bold text-lg">Signature du client</h2>
            <SignaturePad ref={padRef} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full h-12 text-base" onClick={handleSign} disabled={saving}>
              <PenLine className="w-4 h-4 mr-1.5" />
              {saving ? "Enregistrement…" : "Valider et verrouiller le certificat"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Une fois signé, le certificat ne pourra plus être modifié.
            </p>
          </div>
        </>
      )}
    </div>
  );
}