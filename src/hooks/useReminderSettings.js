import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULT_REMINDER_HTML = `<p>Bonjour {{client}},</p>
<p>Nous vous rappelons votre intervention <strong>{{type}}</strong> prévue le <strong>{{date}}</strong> à <strong>{{heure}}</strong>.</p>
<p>À bientôt,<br/>L'équipe</p>`;

const DEFAULT_REVIEW_HTML = `<p>Bonjour {{client}},</p>
<p>Nous espérons que notre intervention {{type}} du {{date}} vous a satisfait.</p>
<p>Votre avis compte beaucoup pour nous :</p>
<p><a href="{{lien_avis}}" style="display:inline-block;padding:10px 18px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;">Laisser un avis Google</a></p>
<p>Merci !</p>`;

const DEFAULTS = {
  enabled: true,
  days_before: 2,
  reminder_subject: "Rappel : votre intervention approche",
  reminder_html: DEFAULT_REMINDER_HTML,
  review_enabled: false,
  review_days_after: 1,
  review_subject: "Votre avis nous intéresse",
  review_html: DEFAULT_REVIEW_HTML,
  google_review_link: "",
};

// Charge l'unique enregistrement de réglages (en le créant si besoin)
// et fournit une fonction de mise à jour optimiste.
export function useReminderSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.ReminderSettings.list();
      if (list.length > 0) {
        setSettings({ ...DEFAULTS, ...list[0] });
      } else {
        const created = await base44.entities.ReminderSettings.create(DEFAULTS);
        setSettings(created);
      }
    })();
  }, []);

  // Sauvegarde immédiate (interrupteurs, délais…)
  const update = async (patch) => {
    setSaving(true);
    setSettings((s) => ({ ...s, ...patch }));
    await base44.entities.ReminderSettings.update(settings.id, patch);
    setSaving(false);
  };

  // Modification locale en attente (sujet / HTML), à valider avec save()
  const updateLocal = (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    setDirty(true);
  };

  // Enregistre les champs en attente
  const save = async (fields) => {
    setSaving(true);
    const patch = {};
    fields.forEach((f) => {
      patch[f] = settings[f];
    });
    await base44.entities.ReminderSettings.update(settings.id, patch);
    setSaving(false);
    setDirty(false);
  };

  return { settings, saving, dirty, update, updateLocal, save };
}