import InterventionTypes from "@/components/settings/InterventionTypes";
import GoogleSync from "@/components/settings/GoogleSync";
import GmailConnect from "@/components/settings/GmailConnect";
import ReminderSettings from "@/components/settings/ReminderSettings";
import SmsReminderSettings from "@/components/settings/SmsReminderSettings";
import GoogleReviewSettings from "@/components/settings/GoogleReviewSettings";
import DailySendTime from "@/components/settings/DailySendTime";

export default function Parametres() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="font-display font-bold text-xl md:text-2xl mb-2">Réglages</h1>
      <GoogleSync />
      <GmailConnect />
      <DailySendTime />
      <ReminderSettings />
      <SmsReminderSettings />
      <GoogleReviewSettings />
      <InterventionTypes />
    </div>
  );
}