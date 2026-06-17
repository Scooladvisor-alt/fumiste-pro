// Calcule l'état d'échéance des entretiens obligatoires d'un client.
// Ramonage : obligatoire tous les ans (12 mois).
// Test d'étanchéité : obligatoire tous les 3 ans (36 mois).

function monthsSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export function getRamonageStatus(client, months = 12) {
  const m = monthsSince(client.last_ramonage_date);
  if (m === null) return { overdue: true, never: true, monthsLate: null };
  return { overdue: m >= months, never: false, monthsLate: m - months };
}

export function getEtancheiteStatus(client, months = 36) {
  const m = monthsSince(client.last_etancheite_date);
  if (m === null) return { overdue: false, never: true, monthsLate: null };
  return { overdue: m >= months, never: false, monthsLate: m - months };
}

// Clients ayant au moins un entretien en retard (ramonage > 1 an OU étanchéité > 3 ans).
export function getClientsToFollowUp(clients, ramonageMonths = 12, etancheiteMonths = 36) {
  return clients
    .map((c) => ({
      client: c,
      ramonage: getRamonageStatus(c, ramonageMonths),
      etancheite: getEtancheiteStatus(c, etancheiteMonths),
    }))
    .filter((row) => row.ramonage.overdue || row.etancheite.overdue);
}

export function formatDateFr(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}