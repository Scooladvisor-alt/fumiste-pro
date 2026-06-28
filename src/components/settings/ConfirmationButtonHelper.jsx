import { useState } from "react";
import { Copy, Check, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";

// Bloc HTML d'un bouton de confirmation prêt à coller dans l'e-mail de rappel.
// {{lien_confirmation}} est remplacé à l'envoi par l'URL unique du rendez-vous.
const BUTTON_HTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding:20px 0;">
      <a href="{{lien_confirmation}}"
         style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;padding:14px 32px;font-weight:bold;font-size:16px;">
        ✅ Je confirme ma présence
      </a>
    </td>
  </tr>
</table>`;

export default function ConfirmationButtonHelper() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(BUTTON_HTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
      <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-2">
        <MousePointerClick className="w-4 h-4" />
        Bouton « Confirmer ma présence »
      </div>
      <p className="text-sm text-emerald-900/80 mb-3">
        Ajoutez ce bouton dans votre e-mail de rappel. Quand le client clique, sa présence est
        enregistrée automatiquement et la mention « Présence confirmée le… » est ajoutée dans la
        description du rendez-vous (et sur Google Calendar).
      </p>

      <pre className="text-xs bg-white border border-emerald-200 rounded-lg p-3 overflow-x-auto text-slate-700 mb-3 whitespace-pre-wrap">
{BUTTON_HTML}
      </pre>

      <Button onClick={copy} size="sm" variant="outline" className="gap-2 bg-white">
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copié !" : "Copier le bouton HTML"}
      </Button>

      <p className="text-xs text-emerald-900/70 mt-3">
        Astuce : vous pouvez aussi utiliser simplement la variable{" "}
        <code className="bg-white px-1 py-0.5 rounded border border-emerald-200">{"{{lien_confirmation}}"}</code>{" "}
        comme lien sur n'importe quel texte ou bouton de votre choix.
      </p>
    </div>
  );
}