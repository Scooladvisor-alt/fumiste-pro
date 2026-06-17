import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const VARIABLES = [
  { token: "{{client}}", label: "Nom du client" },
  { token: "{{date}}", label: "Date de l'intervention" },
  { token: "{{heure}}", label: "Heure de l'intervention" },
  { token: "{{type}}", label: "Type d'intervention" },
  { token: "{{lien_avis}}", label: "Lien avis Google" },
];

// Valeurs de démonstration pour l'aperçu
const SAMPLE = {
  "{{client}}": "Jean Dupont",
  "{{date}}": "lundi 20 janvier 2026",
  "{{heure}}": "14:00",
  "{{type}}": "Ramonage",
  "{{lien_avis}}": "https://g.page/r/votre-page-avis",
};

function renderPreview(html) {
  let out = html || "";
  Object.entries(SAMPLE).forEach(([token, value]) => {
    out = out.split(token).join(value);
  });
  return out;
}

export default function HtmlEmailEditor({
  subject,
  html,
  onSubjectChange,
  onHtmlChange,
  variables = VARIABLES,
}) {
  const textareaRef = useRef(null);

  const insertVariable = (token) => {
    const el = textareaRef.current;
    const current = html || "";
    const pos = el ? el.selectionStart : current.length;
    const next = current.slice(0, pos) + token + current.slice(pos);
    onHtmlChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Objet de l'e-mail</Label>
        <Input
          value={subject || ""}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Objet de l'e-mail…"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Variables disponibles</Label>
        <div className="flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <button
              key={v.token}
              type="button"
              onClick={() => insertVariable(v.token)}
              title={v.label}
              className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent font-mono"
            >
              {v.token}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Cliquez pour insérer une variable. Elle sera remplacée par la valeur réelle à l'envoi.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Code HTML</Label>
          <Textarea
            ref={textareaRef}
            value={html || ""}
            onChange={(e) => onHtmlChange(e.target.value)}
            placeholder="<p>Bonjour {{client}}…</p>"
            className="resize-none font-mono text-xs h-96"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Aperçu en temps réel</Label>
          <iframe
            title="Aperçu de l'e-mail"
            className="w-full h-96 border border-border rounded-md bg-white"
            sandbox=""
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:16px;font-family:Inter,system-ui,sans-serif;color:#1f2937;font-size:14px;line-height:1.5;}img{max-width:100%;height:auto;}</style></head><body>${renderPreview(html)}</body></html>`}
          />
        </div>
      </div>
    </div>
  );
}