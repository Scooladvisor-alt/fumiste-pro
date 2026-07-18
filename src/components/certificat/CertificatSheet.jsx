import { format } from "date-fns";
import { fr } from "date-fns/locale";

function Line({ label, value }) {
  return (
    <p className="text-sm leading-7">
      <span className="text-stone-500">{label} : </span>
      <span className="font-medium border-b border-dotted border-stone-300">{value || "—"}</span>
    </p>
  );
}

function FieldArea({ label, value, editable, onChange, placeholder }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">{label}</p>
      {editable ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm resize-none outline-none border-b border-dotted border-stone-400 focus:border-stone-800 leading-6"
        />
      ) : (
        <p className="text-sm whitespace-pre-wrap min-h-[24px] border-b border-dotted border-stone-300 pb-1">
          {value || "—"}
        </p>
      )}
    </div>
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

// Feuille A4 unifiée du certificat. En mode éditable, les champs à compléter
// sont directement intégrés dans la feuille.
export default function CertificatSheet({ cert, editable, form, onChange, signatureArea, sheetRef }) {
  const data = editable ? { ...cert, ...form } : cert;
  const set = (k) => (v) => onChange({ ...form, [k]: v });
  const dateStr = data.intervention_date
    ? format(new Date(data.intervention_date), "d MMMM yyyy", { locale: fr })
    : "—";

  return (
    <div
      ref={sheetRef}
      className="w-full max-w-[794px] mx-auto bg-white text-stone-900 shadow-lg border border-stone-200 px-8 py-10 sm:px-12 sm:py-12 min-h-[1000px] flex flex-col gap-6"
    >
      {/* En-tête */}
      <div className="text-center border-b-2 border-stone-900 pb-4">
        <h1 className="font-display font-extrabold text-2xl tracking-wide">CERTIFICAT DE RAMONAGE</h1>
        <p className="text-sm text-stone-500 mt-1">Certificat n° {data.certificate_number}</p>
      </div>

      {/* Entreprise / Client */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Entreprise</p>
          <Line label="Nom" value={data.company_name} />
          <Line label="Coordonnées" value={data.company_details} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Client</p>
          <Line label="Nom" value={data.client_name} />
          <Line label="Adresse" value={data.client_address} />
          <Line label="E-mail" value={data.client_email} />
          <Line label="Téléphone" value={data.client_phone} />
        </div>
      </div>

      {/* Intervention */}
      <p className="text-sm leading-7">
        Intervention effectuée le{" "}
        <span className="font-semibold border-b border-dotted border-stone-400 px-1">{dateStr}</span> à{" "}
        <span className="font-semibold border-b border-dotted border-stone-400 px-1">
          {data.intervention_time || "—"}
        </span>
        .
      </p>

      {/* Texte standard */}
      <p className="text-sm leading-relaxed text-justify">
        Je soussigné(e), représentant l'entreprise <strong>{data.company_name || "—"}</strong>, certifie
        avoir procédé ce jour au ramonage du conduit de fumée du client désigné ci-dessus, conformément
        aux dispositions du Règlement Sanitaire Départemental en vigueur. Le présent certificat atteste
        de la vacuité du conduit sur toute sa longueur ainsi que de son état de fonctionnement au moment
        de l'intervention.
      </p>

      {/* Résultat */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
          Résultat de l'intervention
        </p>
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

      <FieldArea
        label="Observations"
        value={data.observations}
        editable={editable}
        onChange={set("observations")}
        placeholder="Observations sur l'intervention…"
      />
      <FieldArea
        label="Non-conformités éventuelles"
        value={data.non_conformites}
        editable={editable}
        onChange={set("non_conformites")}
        placeholder="Non-conformités constatées, le cas échéant…"
      />
      <FieldArea
        label="Commentaires complémentaires"
        value={data.commentaires}
        editable={editable}
        onChange={set("commentaires")}
        placeholder="Commentaires additionnels…"
      />

      {/* Signature */}
      <div className="mt-auto pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
          Signature du client
        </p>
        {editable ? (
          signatureArea
        ) : (
          <div className="border border-stone-300 rounded-sm h-44 flex flex-col items-start justify-end p-3">
            {data.signature_url && (
              <img src={data.signature_url} alt="Signature du client" className="h-32 object-contain" />
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
  );
}