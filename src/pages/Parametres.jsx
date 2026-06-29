import { useState } from "react";
import { Settings, Building2, MessageSquare, Wrench } from "lucide-react";
import InterventionTypes from "@/components/settings/InterventionTypes";
import SendEmailsNow from "@/components/settings/SendEmailsNow";
import CommunicationSettings from "@/components/settings/CommunicationSettings";
import CompanyNameSettings from "@/components/settings/CompanyNameSettings";
import DailySendTime from "@/components/settings/DailySendTime";
import AgendaHours from "@/components/settings/AgendaHours";
import GmailConnectionStatus from "@/components/settings/GmailConnectionStatus";

const TABS = [
  { id: "general", label: "Général", icon: Building2 },
  { id: "communications", label: "Communications", icon: MessageSquare },
  { id: "interventions", label: "Interventions", icon: Wrench },
];

export default function Parametres() {
  const [tab, setTab] = useState("general");

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ember to-ember-deep flex items-center justify-center shadow-md shadow-ember/25 shrink-0">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl leading-tight">Réglages</h1>
          <p className="text-sm text-muted-foreground">Configurez votre entreprise et vos automatisations.</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-2xl bg-secondary mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "general" && (
        <div className="space-y-4">
          <CompanyNameSettings />
          <GmailConnectionStatus />
          <AgendaHours />
        </div>
      )}

      {tab === "communications" && (
        <div className="space-y-4">
          <DailySendTime />
          <SendEmailsNow />
          <CommunicationSettings />
        </div>
      )}

      {tab === "interventions" && (
        <div className="space-y-4">
          <InterventionTypes />
        </div>
      )}
    </div>
  );
}