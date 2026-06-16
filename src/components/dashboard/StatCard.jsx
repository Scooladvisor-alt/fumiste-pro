export default function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="font-display font-extrabold text-3xl">{value}</p>
    </div>
  );
}