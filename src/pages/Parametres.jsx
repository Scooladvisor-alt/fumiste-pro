import InterventionTypes from "@/components/settings/InterventionTypes";
import GoogleSync from "@/components/settings/GoogleSync";
import ReminderSettings from "@/components/settings/ReminderSettings";

export default function Parametres() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="font-display font-bold text-xl md:text-2xl mb-2">Réglages</h1>
      <GoogleSync />
      <ReminderSettings />
      <InterventionTypes />
    </div>
  );
}