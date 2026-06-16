// Helpers pour les rendez-vous

export function buildTitle(interventionType, clientName) {
  const type = interventionType || "Intervention";
  const name = clientName || "Client";
  return `${type} - ${name}`;
}

export function buildDescription(client, interventionType, notes) {
  const lines = [
    `Client : ${client?.full_name || "-"}`,
    `Téléphone : ${client?.phone || "-"}`,
    `Email : ${client?.email || "-"}`,
    `Ville : ${client?.city || "-"}`,
    `Intervention : ${interventionType || "-"}`,
    `Notes : ${notes || "-"}`,
  ];
  return lines.join("\n");
}