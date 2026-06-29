import { Settings } from "lucide-react";
import InterventionTypes from "@/components/settings/InterventionTypes";
import SendEmailsNow from "@/components/settings/SendEmailsNow";
import CommunicationSettings from "@/components/settings/CommunicationSettings";
import CompanyNameSettings from "@/components/settings/CompanyNameSettings";
import DailySendTime from "@/components/settings/DailySendTime";
import AgendaHours from "@/components/settings/AgendaHours";

export default function Parametres() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ember to-ember-deep flex items-center justify-center shadow-md shadow-ember/25 shrink-0">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-display font-bold text-xl md:text-2xl">Réglages</h1>
      </div>
      <CompanyNameSettings />
      <AgendaHours />
      <DailySendTime />
      <SendEmailsNow />
      <CommunicationSettings />
      <InterventionTypes />
    </div>
  );
}