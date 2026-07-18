import { format } from "date-fns";
import { fr } from "date-fns/locale";

function InlineInput({ value, onChange, placeholder, editable, className = "" }) {
  if (!editable) {
    return (
      <span className={`font-medium border-b border-dotted border-stone-300 ${className}`}>
        {value || "—"}
      </span>
    );
  }
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent outline-none border-b border-dotted border-stone-400 focus:border-stone-800 text-sm font-medium ${className}`}
    />
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 border-b border-stone-200 pb-1">
      {children}
    </p>
  );
}

function CheckBox({ checked, label, onClick, editable }) {
  return (
    <button
      type="button"
      disabled={!editable}
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium disabled:cursor-default"
    >
      <span
        className={`w-4 h-4 border border-stone-700 inline-flex items-center justify-center text-[11px] font-bold ${
          checked ? "bg-stone-900 text-white" : "bg-white"
        }`}
      >
        {checked ? "✕" : ""}
      </span>
      {label}
    </button>
  );
}

// Feuille A4 du certificat de ramonage, conforme au décret n° 2023-641
// (11 mentions obligatoires). En mode éditable, les champs sont intégrés
// directement dans la feuille.
export default function CertificatSheet({ cert, editable, form, onChange, signatureArea, sheetRef }) {
  const data = editable ? { ...cert, ...form } : cert;
  const set = (k) => (v) => onChange({ ...form, [k]: v });
  const fmtDate = (d) => (d ? format(new Date(d), "d MMMM yyyy", { locale: fr }) : "—");

  return (
    <div
      ref={sheetRef}
      className="w-full max-w-[794px] mx-auto bg-white text-stone-900 shadow-lg border border-stone-200 px-8 py-9 sm:px-12 sm:py-11 min-h-[1050px] flex flex-col gap-5"
    >
      {/* En-tête : identité du professionnel (mentions 1) */}
      <div className="text-center border-b-2 border-stone-900 pb-4">
        <h1 className="font-display font-extrabold text-2xl tracking-wide">CERTIFICAT DE RAMONAGE</h1>
        <p className="text-sm font-semibold mt-1.5">
          {data.company_name || "—"}
          {data.company_siret ? ` • SIRET ${data.company_siret}` : ""}
          {data.company_rc_pro ? ` • RC Pro n° ${data.company_rc_pro}` : ""}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">
          {[data.company_address, data.company_phone].filter(Boolean).join(" • ") || " "}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">Certificat n° {data.certificate_number}</p>
      </div>

      {/* Client / Intervention (mentions 2) */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <SectionTitle>Client</SectionTitle>
          <p className="text-sm leading-7 font-medium">{data.client_name || "—"}</p>
          <p className="text-sm leading-7">
            <InlineInput
              editable={editable}
              value={data.client_address}
              onChange={set("client_address")}
              placeholder="Adresse du client…"
              className="w-full"
            />
          </p>
          <p className="text-sm leading-7 text-stone-600">
            {[data.client_phone, data.client_email].filter(Boolean).join(" • ")}
          </p>
        </div>
        <div>
          <SectionTitle>Intervention</SectionTitle>
          <p className="text-sm leading-7">
            <span className="text-stone-500">Date : </span>
            <span className="font-medium">{fmtDate(data.intervention_date)}</span>
            {data.intervention_time ? ` à ${data.intervention_time}` : ""}
          </p>
          <p className="text-sm leading-7 flex gap-1.5">
            <span className="text-stone-500 shrink-0">Adresse : </span>
            <InlineInput
              editable={editable}
              value={data.intervention_address}
              onChange={set("intervention_address")}
              placeholder="Si différente du client…"
              className="w-full"
            />
          </p>
        </div>
      </div>

      {/* Détails techniques (mention 3) */}
      <div>
        <SectionTitle>Détails techniques</SectionTitle>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <p className="text-sm leading-7 flex gap-1.5">
            <span className="text-stone-500 shrink-0">Type de conduit :</span>
            <InlineInput
              editable={editable}
              value={data.conduit_type}
              onChange={set("conduit_type")}
              placeholder="ex. tubage inox Ø 150 mm"
              className="flex-1"
            />
          </p>
          <p className="text-sm leading-7 flex gap-1.5">
            <span className="text-stone-500 shrink-0">Combustible :</span>
            <InlineInput
              editable={editable}
              value={data.combustible}
              onChange={set("combustible")}
              placeholder="bois, granulés, gaz, fioul…"
              className="flex-1"
            />
          </p>
        </div>
        <p className="text-sm leading-7 flex gap-1.5 mt-0.5">
          <span className="text-stone-500 shrink-0">Méthode de ramonage :</span>
          <InlineInput
            editable={editable}
            value={data.methode_ramonage}
            onChange={set("methode_ramonage")}
            placeholder="ex. ramonage mécanique par le haut (hérisson + cannes)"
            className="flex-1"
          />
        </p>
      </div>

      {/* État du conduit (mention 4) */}
      <div>
        <SectionTitle>État du conduit</SectionTitle>
        <div className="flex items-center gap-8 mb-2">
          <CheckBox
            checked={data.etat_conduit === "bon"}
            label="Bon état"
            editable={editable}
            onClick={() => set("etat_conduit")("bon")}
          />
          <CheckBox
            checked={data.etat_conduit === "correct"}
            label="État correct"
            editable={editable}
            onClick={() => set("etat_conduit")("correct")}
          />
          <CheckBox
            checked={data.etat_conduit === "degrade"}
            label="Dégradé"
            editable={editable}
            onClick={() => set("etat_conduit")("degrade")}
          />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">
          Observations et anomalies constatées
        </p>
        {editable ? (
          <textarea
            value={data.observations || ""}
            onChange={(e) => set("observations")(e.target.value)}
            rows={2}
            placeholder="ex. Aucune anomalie constatée. Conduit en bon état de fonctionnement."
            className="w-full bg-transparent text-sm resize-none outline-none border-b border-dotted border-stone-400 focus:border-stone-800 leading-6"
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap min-h-[24px] border-b border-dotted border-stone-300 pb-1">
            {data.observations || "—"}
          </p>
        )}
      </div>

      {/* Test de vacuité (mention obligatoire souvent oubliée) */}
      <div>
        <SectionTitle>Test de vacuité</SectionTitle>
        <div className="flex items-center gap-8">
          <CheckBox
            checked={data.conforme === "conforme"}
            label="Conforme"
            editable={editable}
            onClick={() => set("conforme")("conforme")}
          />
          <CheckBox
            checked={data.conforme === "non_conforme"}
            label="Non conforme"
            editable={editable}
            onClick={() => set("conforme")("non_conforme")}
          />
        </div>
      </div>

      {/* Attestation */}
      <p className="text-sm leading-relaxed text-justify">
        Je soussigné(e), représentant l'entreprise <strong>{data.company_name || "—"}</strong>,
        certifie avoir procédé au ramonage mécanique du conduit de fumée désigné ci-dessus,
        conformément au décret n° 2023-641 du 20 juillet 2023 et au Règlement Sanitaire
        Départemental en vigueur. Le présent certificat atteste de la vacuité du conduit sur toute
        sa longueur au moment de l'intervention.
      </p>

      {/* Signatures (mention 5) */}
      <div className="grid grid-cols-2 gap-6 mt-auto">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
            Signature du professionnel
          </p>
          <div className="border border-stone-300 rounded-sm h-40 flex flex-col p-3">
            {editable ? (
              <input
                value={data.professional_name || ""}
                onChange={(e) => set("professional_name")(e.target.value)}
                placeholder="Nom du signataire…"
                className="bg-transparent outline-none border-b border-dotted border-stone-400 focus:border-stone-800 text-sm w-full"
              />
            ) : null}
            <p className="mt-auto font-serif italic text-2xl text-stone-800">
              {data.professional_name || ""}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
            Signature du client
          </p>
          {editable ? (
            signatureArea
          ) : (
            <div className="border border-stone-300 rounded-sm h-40 flex flex-col items-start justify-end p-3">
              {data.signature_url && (
                <img src={data.signature_url} alt="Signature du client" className="h-28 object-contain" />
              )}
              {data.signed_at && (
                <p className="text-xs text-stone-500 mt-1">
                  Signé le {format(new Date(data.signed_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prochain ramonage */}
      <div className="flex items-center gap-2 text-sm bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5">
        <span>📅</span>
        <span className="text-stone-600">Prochain ramonage recommandé avant le</span>
        {editable ? (
          <input
            type="date"
            value={data.next_ramonage_date || ""}
            onChange={(e) => set("next_ramonage_date")(e.target.value)}
            className="bg-transparent outline-none border-b border-dotted border-stone-400 focus:border-stone-800 text-sm font-semibold"
          />
        ) : (
          <span className="font-semibold">{fmtDate(data.next_ramonage_date)}</span>
        )}
      </div>

      <p className="text-[10px] text-stone-400 text-center">
        Certificat établi conformément au décret n° 2023-641 du 20 juillet 2023 — Document à
        conserver et à présenter à votre assureur.
      </p>
    </div>
  );
}