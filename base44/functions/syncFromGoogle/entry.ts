import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const state = body?.data?._provider_meta?.['x-goog-resource-state'];
    if (state === 'sync') {
      return Response.json({ status: 'sync_ack' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Load sync token
    const existing = await base44.asServiceRole.entities.SyncState.list();
    const syncRecord = existing.length > 0 ? existing[0] : null;

    const baseParams = 'maxResults=100&singleEvents=true&showDeleted=true';
    let url = `${CAL_URL}?${baseParams}`;
    if (syncRecord?.sync_token) {
      url += `&syncToken=${syncRecord.sync_token}`;
    } else {
      url += '&timeMin=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    let res = await fetch(url, { headers: authHeader });
    if (res.status === 410) {
      url = `${CAL_URL}?${baseParams}` + '&timeMin=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      res = await fetch(url, { headers: authHeader });
    }
    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ status: 'api_error', detail }, { status: 502 });
    }

    // Drain all pages
    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;
    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const nextRes = await fetch(`${url}&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    // Existing appointments already linked to a google event
    const linked = await base44.asServiceRole.entities.Appointment.filter({});
    const byGoogleId = {};
    for (const a of linked) {
      if (a.google_event_id) byGoogleId[a.google_event_id] = a;
    }

    let created = 0, updated = 0, deleted = 0;

    for (const ev of allItems) {
      const localMatch = byGoogleId[ev.id];

      // Event cancelled in Google -> remove locally
      if (ev.status === 'cancelled') {
        if (localMatch) {
          await base44.asServiceRole.entities.Appointment.delete(localMatch.id);
          deleted++;
        }
        continue;
      }

      // Skip events without proper datetime (all-day handled as date)
      const startISO = ev.start?.dateTime || (ev.start?.date ? new Date(ev.start.date).toISOString() : null);
      const endISO = ev.end?.dateTime || (ev.end?.date ? new Date(ev.end.date).toISOString() : null);
      if (!startISO || !endISO) continue;

      const payload = {
        title: ev.summary || 'Rendez-vous',
        notes: ev.description || '',
        start: startISO,
        end: endISO,
        google_event_id: ev.id,
      };

      if (localMatch) {
        // Update only if something actually changed (avoid sync loop)
        const changed =
          localMatch.title !== payload.title ||
          new Date(localMatch.start).getTime() !== new Date(startISO).getTime() ||
          new Date(localMatch.end).getTime() !== new Date(endISO).getTime() ||
          (localMatch.notes || '') !== payload.notes;
        if (changed) {
          await base44.asServiceRole.entities.Appointment.update(localMatch.id, payload);
          updated++;
        }
      } else {
        await base44.asServiceRole.entities.Appointment.create({ ...payload, color: '#3b82f6' });
        created++;
      }
    }

    // Persist new sync token
    if (newSyncToken) {
      if (syncRecord) {
        await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { sync_token: newSyncToken });
      } else {
        await base44.asServiceRole.entities.SyncState.create({ sync_token: newSyncToken });
      }
    }

    return Response.json({ status: 'ok', created, updated, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});