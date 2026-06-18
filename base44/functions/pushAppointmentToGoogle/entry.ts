import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const CALENDAR_CONNECTOR_ID = '6a32cbfde2927ef1458ec237';

// Pousse un rendez-vous du logiciel vers le Google Calendar de l'UTILISATEUR COURANT.
// Appelée depuis le frontend après création / modification / suppression d'un RDV.
// payload: { appointmentId, action: 'upsert' | 'delete', googleEventId? }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId, action, googleEventId } = await req.json();

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CALENDAR_CONNECTOR_ID);
      accessToken = conn?.accessToken;
    } catch {
      accessToken = null;
    }
    // Calendrier non connecté : on ne bloque pas l'app, on ignore simplement le push.
    if (!accessToken) {
      return Response.json({ status: 'calendar_not_connected' });
    }
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // SUPPRESSION
    if (action === 'delete') {
      if (googleEventId) {
        await fetch(`${CAL_URL}/${googleEventId}`, { method: 'DELETE', headers: authHeader });
      }
      return Response.json({ status: 'deleted' });
    }

    // UPSERT : on (re)lit le rendez-vous pour avoir des données à jour (RLS = appartient à l'utilisateur)
    const appt = await base44.entities.Appointment.get(appointmentId);
    if (!appt || !appt.start || !appt.end) {
      return Response.json({ status: 'skipped', reason: 'no_dates' });
    }

    const eventBody = {
      summary: appt.title || 'Rendez-vous',
      description: appt.notes || '',
      start: { dateTime: new Date(appt.start).toISOString() },
      end: { dateTime: new Date(appt.end).toISOString() },
    };

    // MISE À JOUR d'un event existant
    if (appt.google_event_id) {
      const res = await fetch(`${CAL_URL}/${appt.google_event_id}`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify(eventBody),
      });
      if (res.ok) {
        return Response.json({ status: 'updated', google_event_id: appt.google_event_id });
      }
      // sinon l'event a été supprimé côté Google -> on le recrée ci-dessous
    }

    // CRÉATION d'un nouvel event
    const createRes = await fetch(CAL_URL, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(eventBody),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      return Response.json({ status: 'api_error', detail: err }, { status: 502 });
    }
    const created = await createRes.json();
    await base44.entities.Appointment.update(appointmentId, { google_event_id: created.id });

    return Response.json({ status: 'created', google_event_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});