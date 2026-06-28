import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

function page(title, message, accent = '#16a34a') {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:Inter,Arial,sans-serif;background:#f4f1ee;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:440px;background:#fff;border-radius:18px;padding:40px 32px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.08);margin:16px;">
<div style="width:64px;height:64px;border-radius:50%;background:${accent};margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;">✓</div>
<h1 style="margin:0 0 12px;font-size:22px;color:#1c1410;">${title}</h1>
<p style="margin:0;color:#555;font-size:15px;line-height:1.6;">${message}</p>
</div></body></html>`;
}

// Webhook PUBLIC : appelé quand le client clique sur le bouton de confirmation dans l'e-mail.
// Aucune authentification client : l'identifiant du rendez-vous sert de jeton.
// GET /?appt=<appointmentId>
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let apptId = url.searchParams.get('appt');
    if (!apptId) {
      const body = await req.json().catch(() => ({}));
      apptId = body?.appt || null;
    }
    if (!apptId) {
      return new Response(page('Lien invalide', "Ce lien de confirmation n'est pas valide.", '#dc2626'), {
        status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const base44 = createClientFromRequest(req);

    const appt = await base44.asServiceRole.entities.Appointment.get(apptId);
    if (!appt) {
      return new Response(page('Rendez-vous introuvable', "Ce rendez-vous n'existe plus.", '#dc2626'), {
        status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const now = new Date();
    const confirmedLine = `✅ Présence confirmée par le client le ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}`;

    // Évite les doublons si le client clique plusieurs fois.
    const baseNotes = (appt.notes || '').replace(/\n*✅ Présence confirmée.*$/s, '').trimEnd();
    const newNotes = `${baseNotes}\n\n${confirmedLine}`.trim();

    await base44.asServiceRole.entities.Appointment.update(apptId, {
      notes: newNotes,
      attendance_confirmed: true,
      attendance_confirmed_at: now.toISOString(),
    });

    // Met aussi à jour la description de l'événement Google Calendar si lié.
    if (appt.google_event_id) {
      try {
        const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        const accessToken = conn?.accessToken;
        if (accessToken) {
          await fetch(`${CAL_URL}/${appt.google_event_id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: newNotes }),
          });
        }
      } catch {
        // On ignore : la confirmation est déjà enregistrée côté logiciel.
      }
    }

    const dateStr = appt.start
      ? new Date(appt.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : '';
    const heureStr = appt.start
      ? new Date(appt.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
      : '';

    return new Response(
      page('Merci, c\'est confirmé !', `Votre présence pour le rendez-vous${dateStr ? ` du ${dateStr}${heureStr ? ` à ${heureStr}` : ''}` : ''} a bien été enregistrée. À bientôt !`),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    return new Response(page('Erreur', "Une erreur est survenue. Merci de contacter l'entreprise.", '#dc2626'), {
      status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
});