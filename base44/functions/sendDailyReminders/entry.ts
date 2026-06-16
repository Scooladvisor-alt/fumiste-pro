import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function encodeRFC2047(str) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}

function buildMime({ to, subject, body }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${encodeRFC2047(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(body))),
  ];
  const raw = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Charger les réglages
    const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
    const settings = settingsList[0] || { enabled: true, days_before: 2 };

    if (!settings.enabled) {
      return Response.json({ skipped: true, reason: 'disabled' });
    }

    const daysBefore = settings.days_before ?? 2;

    // Calcul de la journée cible (J + daysBefore)
    const now = new Date();
    const target = new Date(now);
    target.setUTCDate(target.getUTCDate() + daysBefore);
    const targetDay = target.toISOString().slice(0, 10); // YYYY-MM-DD

    const appointments = await base44.asServiceRole.entities.Appointment.list();
    const clients = await base44.asServiceRole.entities.Client.list();
    const clientMap = {};
    clients.forEach((c) => { clientMap[c.id] = c; });

    const todays = appointments.filter(
      (a) => a.start && a.start.slice(0, 10) === targetDay
    );

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    let sent = 0;
    const errors = [];

    for (const appt of todays) {
      const client = clientMap[appt.client_id];
      // L'e-mail est extrait de la description (notes) du rendez-vous, telle qu'elle
      // est au moment de l'envoi — pas depuis la fiche client.
      const emailMatch = (appt.notes || appt.description || '').match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      );
      const email = emailMatch ? emailMatch[0] : null;
      if (!email) continue;

      const dt = new Date(appt.start);
      const dateStr = dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      const subject = `Rappel : intervention prévue le ${dateStr}`;
      const body = [
        `Bonjour ${client.full_name || ''},`,
        '',
        `Nous vous rappelons votre intervention prévue le ${dateStr} à ${timeStr}.`,
        appt.intervention_type ? `Type d'intervention : ${appt.intervention_type}` : '',
        client.city ? `Ville : ${client.city}` : '',
        '',
        'À bientôt,',
      ].filter(Boolean).join('\n');

      const raw = buildMime({ to: email, subject, body });
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw }),
      });

      if (res.ok) sent += 1;
      else errors.push(await res.text());
    }

    return Response.json({ targetDay, candidates: todays.length, sent, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});