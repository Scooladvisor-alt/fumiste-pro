import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, PenLine, Download } from "lucide-react";
import { format, addMonths } from "date-fns";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import CertificatSheet from "@/components/certificat/CertificatSheet";
import SignaturePad from "@/components/certificat/SignaturePad";

export default function Certificat() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get("appointment_id");
  const certId = urlParams.get("id");

  const padRef = useRef(null);
  const sheetRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null); // certificat signé et verrouillé
  const [draft, setDraft] = useState(null); // données préremplies (fixes)
  const [form, setForm] = useState(null); // champs à compléter dans la feuille
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (certId) {
        const existing = await base44.entities.RamonageCertificate.get(certId).catch(() => null);
        setCert(existing);
        setLoading(false);
        return;
      }
      if (!appointmentId) {
        setLoading(false);
        return;
      }
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
      const all = await base44.entities.RamonageCertificate.list();
      const start = new Date(appt.start);
      setDraft({
        certificate_number: `RAM-${start.getFullYear()}-${String(all.length + 1).padStart(4, "0")}`,
        appointment_id: appointmentId,
        client_id: appt.client_id || "",
        client_name: client?.full_name || "",
        client_email: client?.email || "",
        client_phone: client?.phone || "",
        intervention_date: format(start, "yyyy-MM-dd"),
        intervention_time: format(start, "HH:mm"),
        company_name: settings?.company_name || "",
        company_address: settings?.company_address || "",
        company_phone: settings?.company_phone || "",
        company_siret: settings?.company_siret || "",
        company_rc_pro: settings?.company_rc_pro || "",
      });
      setForm({
        client_address: client?.city || "",
        intervention_address: "",
        conduit_type: "",
        combustible: "",
        methode_ramonage: "",
        etat_conduit: "bon",
        observations: "Aucune anomalie constatée. Conduit en bon état de fonctionnement.",
        conforme: "conforme",
        next_ramonage_date: format(addMonths(start, 12), "yyyy-MM-dd"),
        professional_name: settings?.company_name || "",
      });
      setLoading(false);
    })();
  }, [appointmentId, certId]);

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

  const handleDownloadPdf = async () => {
    setDownloading(true);
    const canvas = await html2canvas(sheetRef.current, { scale: 2, useCORS: true });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const width = 210;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, width, Math.min(height, 297));
    pdf.save(`certificat-${cert.certificate_number}.pdf`);
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!cert && !draft) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">Certificat introuvable.</p>
        <Button asChild variant="outline">
          <Link to="/agenda">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour à l'agenda
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link to="/agenda">
            <ArrowLeft className="w-4 h-4 mr-1" /> Agenda
          </Link>
        </Button>
        {cert && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary rounded-full px-3 py-1.5">
              <Lock className="w-3.5 h-3.5" /> Signé et verrouillé
            </span>
            <Button size="sm" onClick={handleDownloadPdf} disabled={downloading}>
              <Download className="w-4 h-4 mr-1.5" />
              {downloading ? "Génération…" : "Télécharger en PDF"}
            </Button>
          </div>
        )}
      </div>

      <CertificatSheet
        sheetRef={sheetRef}
        cert={cert || draft}
        editable={!cert}
        form={form}
        onChange={setForm}
        signatureArea={<SignaturePad ref={padRef} />}
      />

      {!cert && (
        <div className="max-w-[794px] mx-auto space-y-3 pb-8">
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button className="w-full h-12 text-base" onClick={handleSign} disabled={saving}>
            <PenLine className="w-4 h-4 mr-1.5" />
            {saving ? "Enregistrement…" : "Valider et verrouiller le certificat"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Une fois signé, le certificat ne pourra plus être modifié.
          </p>
        </div>
      )}
    </div>
  );
}