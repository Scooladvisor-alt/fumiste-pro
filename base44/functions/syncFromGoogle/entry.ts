import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const CALENDAR_CONNECTOR_ID = '6a32cbfde2927ef1458ec237';

// Synchronisation ENTRANTE (Google -> logiciel) pour l'UTILISATEUR COURANT.
// Lit le calendrier Google de l'utilisateur connecté (son propre compte) et
// importe / met à jour / supprime ses rendez-vous dans le logiciel.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Token du calendrier de l'utilisateur courant (son propre compte Google)
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CALENDAR_CONNECTOR_ID);
      accessToken = conn?.accessToken;
    } catch (e) {
      console.log('Erreur récupération connexion calendrier:', e.message);
      accessToken = null;
    }
    if (!accessToken) {
      console.log('Aucun token calendrier pour user', user.id, user.email);
      return Response.json({ status: 'calendar_not_connected' }, { status: 400 });
    }
    console.log('Token calendrier OK pour user', user.id, user.email);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Sync token propre à cet utilisateur
    const states = await base44.asServiceRole.entities.SyncState.filter({ created_by_id: user.id });
    const syncRecord = states.length > 0 ? states[0] : null;

    // Import initial : fenêtre large (90 j passés -> 365 j futurs).
    // Google interdit showDeleted/orderBy combinés avec timeMin sur certains cas,
    // donc l'import initial reste simple (pas de showDeleted, pas de orderBy).
    const timeMin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const freshUrl = `${CAL_URL}?maxResults=100&singleEvents=true&timeMin=${timeMin}&timeMax=${timeMax}`;
    // Sync incrémental : syncToken seul (showDeleted pour récupérer les suppressions).
    let url = syncRecord?.sync_token
      ? `${CAL_URL}?maxResults=100&singleEvents=true&showDeleted=true&syncToken=${syncRecord.sync_token}`
      : freshUrl;

    let res = await fetch(url, { headers: authHeader });
    // Si le syncToken est invalide/expiré (410 OU 400, ex: changement de compte Google),
    // on supprime l'ancien état et on refait un import complet.
    if (!res.ok && url !== freshUrl) {
      console.log('syncToken invalide (status', res.status, ') -> import complet');
      if (syncRecord) {
        try { await base44.asServiceRole.entities.SyncState.delete(syncRecord.id); } catch (_e) { /* ignore */ }
      }
      url = freshUrl;
      res = await fetch(url, { headers: authHeader });
    }
    if (!res.ok) {
      const detail = await res.text();
      console.log('Erreur API Google Calendar', res.status, detail);
      return Response.json({ status: 'api_error', detail }, { status: 502 });
    }

    // Parcourir toutes les pages
    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;
    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const sep = url.includes('?') ? '&' : '?';
      const nextRes = await fetch(`${url}${sep}pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    // Rendez-vous de cet utilisateur déjà liés à un event Google (RLS via user token)
    const linked = await base44.entities.Appointment.list('-start', 2000);
    const byGoogleId = {};
    for (const a of linked) {
      if (a.google_event_id) byGoogleId[a.google_event_id] = a;
    }

    let created = 0, updated = 0, deleted = 0;

    for (const ev of allItems) {
      const localMatch = byGoogleId[ev.id];

      if (ev.status === 'cancelled') {
        if (localMatch) {
          await base44.entities.Appointment.delete(localMatch.id);
          deleted++;
        }
        continue;
      }

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
        const changed =
          localMatch.title !== payload.title ||
          new Date(localMatch.start).getTime() !== new Date(startISO).getTime() ||
          new Date(localMatch.end).getTime() !== new Date(endISO).getTime() ||
          (localMatch.notes || '') !== payload.notes;
        if (changed) {
          await base44.entities.Appointment.update(localMatch.id, payload);
          updated++;
        }
      } else {
        await base44.entities.Appointment.create({ ...payload, color: '#f97316' });
        created++;
      }
    }

    if (newSyncToken) {
      if (syncRecord) {
        await base44.entities.SyncState.update(syncRecord.id, { sync_token: newSyncToken });
      } else {
        await base44.entities.SyncState.create({ sync_token: newSyncToken });
      }
    }

    console.log(`Import terminé: ${allItems.length} events reçus, ${created} créés, ${updated} maj, ${deleted} suppr`);
    return Response.json({ status: 'ok', received: allItems.length, created, updated, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});