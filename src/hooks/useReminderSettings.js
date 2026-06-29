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

const DEFAULT_FOLLOWUP_HTML = `<p>Bonjour {{client}},</p>
<p>Cela fait maintenant un an que nous avons effectué le ramonage de votre appareil (le {{date_dernier_ramonage}}).</p>
<p>Le ramonage est obligatoire chaque année. Pour votre sécurité et la conformité de votre installation, il est temps de planifier un nouveau ramonage.</p>
<p>N'hésitez pas à nous contacter pour reprendre rendez-vous.</p>
<p>À bientôt,<br/>L'équipe</p>`;

const DEFAULT_ETANCHEITE_HTML = `<p>Bonjour {{client}},</p>
<p>Cela fait maintenant trois ans que nous avons réalisé le test d'étanchéité de votre installation (le {{date_dernier_test}}).</p>
<p>Le test d'étanchéité est obligatoire tous les 3 ans. Pour rester en conformité, il est temps de planifier un nouveau contrôle.</p>
<p>N'hésitez pas à nous contacter pour reprendre rendez-vous.</p>
<p>À bientôt,<br/>L'équipe</p>`;

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
  daily_send_hour: 9,
  agenda_start_hour: 6,
  agenda_end_hour: 20,
  followup_enabled: false,
  followup_months: 12,
  followup_subject: "Il est temps de penser à votre ramonage annuel",
  followup_html: DEFAULT_FOLLOWUP_HTML,
  etancheite_followup_enabled: false,
  etancheite_followup_months: 36,
  etancheite_followup_subject: "Votre test d'étanchéité triennal arrive à échéance",
  etancheite_followup_html: DEFAULT_ETANCHEITE_HTML,
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