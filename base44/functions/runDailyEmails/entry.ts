import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function encodeRFC2047(str) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}

function buildMime({ to, subject, html }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${encodeRFC2047(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(html))),
  ];
  const raw = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function applyVars(template, vars) {
  let out = template || '';
  Object.entries(vars).forEach(([token, value]) => {
    out = out.split(token).join(value ?? '');
  });
  return out;
}

function extractEmail(text) {
  const m = (text || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function dayOffset(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Déclenché chaque jour par l'automatisation planifiée.
// Envoie les rappels d'intervention (J-x) et les demandes d'avis Google (J+x).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
    const settings = settingsList[0] || {};

    // N'envoie qu'à l'heure choisie (fuseau Europe/Paris), sauf appel manuel forcé.
    const body = await req.json().catch(() => ({}));
    if (!body.force) {
      const parisHour = Number(
        new Intl.DateTimeFormat('fr-FR', {
          timeZone: 'Europe/Paris',
          hour: '2-digit',
          hour12: false,
        }).format(new Date())
      );
      const sendHour = settings.daily_send_hour ?? 9;
      if (parisHour !== sendHour) {
        return Response.json({ skipped: true, reason: 'not_send_hour', parisHour, sendHour });
      }
    }

    const appointments = await base44.asServiceRole.entities.Appointment.list();
    const clients = await base44.asServiceRole.entities.Client.list();
    const clientMap = {};
    clients.forEach((c) => { clientMap[c.id] = c; });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    async function sendBatch({ targetDay, subjectTpl, htmlTpl, extraVars = {} }) {
      const targets = appointments.filter((a) => a.start && a.start.slice(0, 10) === targetDay);
      let sent = 0;
      const errors = [];
      for (const appt of targets) {
        const client = clientMap[appt.client_id];
        const email = extractEmail(appt.notes || appt.description);
        if (!email) continue;
        const dt = new Date(appt.start);
        const vars = {
          '{{client}}': client?.full_name || '',
          '{{date}}': dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          '{{heure}}': dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          '{{type}}': appt.intervention_type || '',
          ...extraVars,
        };
        const subject = applyVars(subjectTpl, vars);
        const html = applyVars(htmlTpl, vars);
        const raw = buildMime({ to: email, subject, html });
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: authHeader,
          body: JSON.stringify({ raw }),
        });
        if (res.ok) sent += 1;
        else errors.push(await res.text());
      }
      return { targetDay, candidates: targets.length, sent, errors };
    }

    const result = { reminders: { skipped: true }, reviews: { skipped: true } };

    // Rappels d'intervention (J - days_before)
    if (settings.enabled !== false) {
      const daysBefore = settings.days_before ?? 2;
      result.reminders = await sendBatch({
        targetDay: dayOffset(daysBefore),
        subjectTpl: settings.reminder_subject || 'Rappel : votre intervention approche',
        htmlTpl: settings.reminder_html || '<p>Bonjour {{client}}, rappel de votre intervention {{type}} le {{date}} à {{heure}}.</p>',
      });
    }

    // Demandes d'avis Google (J + review_days_after, donc passé)
    if (settings.review_enabled) {
      const daysAfter = settings.review_days_after ?? 1;
      result.reviews = await sendBatch({
        targetDay: dayOffset(-daysAfter),
        subjectTpl: settings.review_subject || 'Votre avis nous intéresse',
        htmlTpl: settings.review_html || '<p>Bonjour {{client}}, <a href="{{lien_avis}}">laissez un avis</a>.</p>',
        extraVars: { '{{lien_avis}}': settings.google_review_link || '' },
      });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});