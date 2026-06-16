import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const eventType = body?.event?.type;
    const entityId = body?.event?.entity_id;
    let data = body?.data;
    const oldData = body?.old_data;

    if (!entityId) {
      return Response.json({ status: 'skipped', reason: 'no_entity_id' });
    }

    // Fetch full record if payload was too large
    if (body?.payload_too_large && eventType !== 'delete') {
      data = await base44.asServiceRole.entities.Appointment.get(entityId);
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // DELETE
    if (eventType === 'delete') {
      const googleId = oldData?.google_event_id;
      if (googleId) {
        await fetch(`${CAL_URL}/${googleId}`, { method: 'DELETE', headers: authHeader });
      }
      return Response.json({ status: 'deleted' });
    }

    if (!data?.start || !data?.end) {
      return Response.json({ status: 'skipped', reason: 'no_dates' });
    }

    const eventBody = {
      summary: data.title || 'Rendez-vous',
      description: data.description || data.notes || '',
      start: { dateTime: new Date(data.start).toISOString() },
      end: { dateTime: new Date(data.end).toISOString() },
    };

    const googleId = data.google_event_id;

    // UPDATE existing google event
    if (googleId) {
      const res = await fetch(`${CAL_URL}/${googleId}`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify(eventBody),
      });
      // If the google event was removed, recreate it below
      if (res.ok) {
        return Response.json({ status: 'updated', google_event_id: googleId });
      }
    }

    // CREATE new google event
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
    // Store google event id back on the appointment (avoid retrigger loop:
    // updating only google_event_id still fires an update event, but the body
    // remains identical so Google just gets a harmless PATCH).
    await base44.asServiceRole.entities.Appointment.update(entityId, {
      google_event_id: created.id,
    });

    return Response.json({ status: 'created', google_event_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});