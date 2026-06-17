const OPTIONS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
];

export default function PeriodFilter({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-muted p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            value === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}