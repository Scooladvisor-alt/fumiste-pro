import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 500),
    initialData: [],
  });
}

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-start", 1000),
    initialData: [],
  });
}

export function useCommunicationLogs() {
  return useQuery({
    queryKey: ["communicationLogs"],
    queryFn: () => base44.entities.CommunicationLog.list("-sent_date", 2000),
    initialData: [],
  });
}

export function useInterventionTypes() {
  return useQuery({
    queryKey: ["interventionTypes"],
    queryFn: () => base44.entities.InterventionType.list("created_date", 100),
    initialData: [],
  });
}

export function useRefreshData() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["interventionTypes"] });
  };
}