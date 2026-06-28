// Contenus d'e-mails par défaut, partagés entre l'onboarding et les réglages.

export const DEFAULT_REMINDER_HTML = `<p>Bonjour {{client}},</p>
<p>Nous vous rappelons votre intervention <strong>{{type}}</strong> prévue le <strong>{{date}}</strong> à <strong>{{heure}}</strong>.</p>
<p>À bientôt,<br/>L'équipe</p>`;

export const DEFAULT_REVIEW_HTML = `<p>Bonjour {{client}},</p>
<p>Nous espérons que notre intervention {{type}} du {{date}} vous a satisfait.</p>
<p>Votre avis compte beaucoup pour nous :</p>
<p><a href="{{lien_avis}}" style="display:inline-block;padding:10px 18px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;">Laisser un avis Google</a></p>
<p>Merci !</p>`;

export const DEFAULT_FOLLOWUP_HTML = `<p>Bonjour {{client}},</p>
<p>Cela fait maintenant un certain temps que nous avons effectué le ramonage de votre appareil (le {{date_dernier_ramonage}}).</p>
<p>Le ramonage est obligatoire régulièrement. Pour votre sécurité et la conformité de votre installation, il est temps de planifier un nouveau ramonage.</p>
<p>N'hésitez pas à nous contacter pour reprendre rendez-vous.</p>
<p>À bientôt,<br/>L'équipe</p>`;

export const DEFAULT_ETANCHEITE_HTML = `<p>Bonjour {{client}},</p>
<p>Cela fait maintenant trois ans que nous avons réalisé le test d'étanchéité de votre installation (le {{date_dernier_test}}).</p>
<p>Le test d'étanchéité est obligatoire tous les 3 ans. Pour rester en conformité, il est temps de planifier un nouveau contrôle.</p>
<p>N'hésitez pas à nous contacter pour reprendre rendez-vous.</p>
<p>À bientôt,<br/>L'équipe</p>`;

// Réglages e-mails par défaut appliqués à la fin de l'onboarding.
export const EMAIL_DEFAULTS = {
  reminder_subject: "Rappel : votre intervention approche",
  reminder_html: DEFAULT_REMINDER_HTML,
  review_subject: "Votre avis nous intéresse",
  review_html: DEFAULT_REVIEW_HTML,
  followup_subject: "Il est temps de penser à votre ramonage",
  followup_html: DEFAULT_FOLLOWUP_HTML,
  etancheite_followup_subject: "Votre test d'étanchéité triennal arrive à échéance",
  etancheite_followup_html: DEFAULT_ETANCHEITE_HTML,
};