import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Automatisation entité (Appointment create/update).
// Met à jour la date du dernier ramonage / test d'étanchéité du client
// selon le type d'intervention du rendez-vous.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const appt = body.data;
    if (!appt || !appt.client_id || !appt.start) {
      return Response.json({ skipped: true, reason: 'no_client_or_start' });
    }

    // "Ramonage" / "étanchéité" peut être dans le type d'intervention OU dans le titre.
    const haystack = `${appt.intervention_type || ''} ${appt.title || ''}`.toLowerCase();
    const date = appt.start.slice(0, 10);

    let field = null;
    if (haystack.includes('ramonage')) field = 'last_ramonage_date';
    else if (haystack.includes('étanch') || haystack.includes('etanch')) field = 'last_etancheite_date';

    if (!field) return Response.json({ skipped: true, reason: 'type_not_tracked' });

    const client = await base44.asServiceRole.entities.Client.get(appt.client_id);
    if (!client) return Response.json({ skipped: true, reason: 'client_not_found' });

    // Ne met à jour que si la nouvelle date est plus récente.
    if (!client[field] || date > client[field]) {
      await base44.asServiceRole.entities.Client.update(appt.client_id, { [field]: date });
      return Response.json({ updated: true, field, date });
    }

    return Response.json({ skipped: true, reason: 'not_more_recent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});