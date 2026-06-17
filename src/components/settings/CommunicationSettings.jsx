import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Star, RefreshCw } from "lucide-react";
import ReminderSettings from "./ReminderSettings";
import SmsReminderSettings from "./SmsReminderSettings";
import GoogleReviewSettings from "./GoogleReviewSettings";
import MaintenanceFollowupSettings from "./MaintenanceFollowupSettings";

export default function CommunicationSettings() {
  return (
    <div>
      <Tabs defaultValue="rappels" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto mb-2">
          <TabsTrigger value="rappels" className="gap-1.5 py-2 text-xs md:text-sm">
            <Bell className="w-4 h-4" /> Rappels
          </TabsTrigger>
          <TabsTrigger value="avis" className="gap-1.5 py-2 text-xs md:text-sm">
            <Star className="w-4 h-4" /> Avis Google
          </TabsTrigger>
          <TabsTrigger value="relances" className="gap-1.5 py-2 text-xs md:text-sm">
            <RefreshCw className="w-4 h-4" /> Relances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rappels" className="mt-4 space-y-4">
          <ReminderSettings />
          <SmsReminderSettings />
        </TabsContent>

        <TabsContent value="avis" className="mt-4">
          <GoogleReviewSettings />
        </TabsContent>

        <TabsContent value="relances" className="mt-4">
          <MaintenanceFollowupSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}