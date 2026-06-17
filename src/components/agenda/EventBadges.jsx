// Petits indicateurs discrets affichés en bas d'un évènement
// pour signaler les communications déjà envoyées.
const BADGES = [
  { key: "reminder_email_sent", emoji: "📧", label: "E-mail de rappel envoyé" },
  { key: "reminder_sms_sent", emoji: "💬", label: "SMS de rappel envoyé" },
  { key: "review_email_sent", emoji: "⭐", label: "Demande d'avis Google envoyée" },
  { key: "followup_email_sent", emoji: "🔔", label: "Relance entretien envoyée" },
];

export default function EventBadges({ appointment, className = "" }) {
  const active = BADGES.filter((b) => appointment && appointment[b.key]);
  if (active.length === 0) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 leading-none ${className}`}>
      {active.map((b) => (
        <span key={b.key} title={b.label} className="text-[9px]">
          {b.emoji}
        </span>
      ))}
    </span>
  );
}