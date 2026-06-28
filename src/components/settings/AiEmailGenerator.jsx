import { useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

// Génère un e-mail HTML via l'IA intégrée, à partir d'instructions libres,
// d'une charte graphique et de liens optionnels. Remplit l'objet et le HTML.
export default function AiEmailGenerator({ variables, onResult }) {
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [brand, setBrand] = useState("");
  const [links, setLinks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const varList = variables.map((v) => `${v.token} (${v.label})`).join(", ");

  const generate = async () => {
    if (!instructions.trim()) return;
    setLoading(true);
    setError("");
    try {
      const prompt = `Tu es un expert en création d'e-mails HTML responsives pour une entreprise de ramonage/fumisterie.
Génère un e-mail HTML complet, moderne et compatible avec les clients mail (tables inline-CSS, pas de <style> externe, pas de JavaScript).

INSTRUCTIONS DE L'UTILISATEUR :
${instructions}

CHARTE GRAPHIQUE À RESPECTER :
${brand || "Aucune précisée — utilise un style sobre et professionnel."}

LIENS À INTÉGRER (boutons / liens cliquables) :
${links || "Aucun lien fourni."}

VARIABLES DISPONIBLES (à insérer telles quelles, elles seront remplacées automatiquement) : ${varList}.
Utilise les variables pertinentes (par exemple {{client}} pour personnaliser).

Réponds STRICTEMENT au format demandé : un objet d'e-mail percutant et le code HTML complet.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            html: { type: "string" },
          },
          required: ["subject", "html"],
        },
      });
      onResult({ subject: res.subject, html: res.html });
      setOpen(false);
    } catch (e) {
      setError("La génération a échoué. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-primary/30 bg-accent/40 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ember to-ember-deep flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-sm">Générer l'e-mail avec l'IA</p>
          <p className="text-xs text-muted-foreground">
            Décrivez ce que vous voulez, l'IA écrit le HTML pour vous.
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-primary/20 pt-3">
          <div className="space-y-1.5">
            <Label>Que doit dire cet e-mail ?</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex : Rappeler au client que son ramonage annuel approche, ton chaleureux, inciter à réserver."
              className="resize-y text-sm h-24 min-h-20"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Charte graphique (optionnel)</Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ex : couleurs bordeaux #6B1C1C et or #FFD700, logo, ton professionnel"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Liens à intégrer (optionnel)</Label>
            <Input
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Ex : Réserver → https://www.abm77.fr/reservation"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="button"
            onClick={generate}
            disabled={loading || !instructions.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-ember to-ember-deep text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Générer l'e-mail
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground">
            Le résultat remplit l'objet et le code HTML ci-dessous. Vous pouvez ensuite l'ajuster.
          </p>
        </div>
      )}
    </div>
  );
}