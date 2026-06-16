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

const DEFAULT_HTML = `<p>Bonjour {{client}},</p>
<p>Nous espérons que notre intervention {{type}} du {{date}} vous a satisfait.</p>
<p><a href="{{lien_avis}}">Laisser un avis Google</a></p>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
    const settings = settingsList[0] || {};

    if (!settings.review_enabled) {
      return Response.json({ skipped: true, reason: 'disabled' });
    }

    const daysAfter = settings.review_days_after ?? 1;

    // Journée cible = aujourd'hui - daysAfter (l'intervention a eu lieu il y a daysAfter jours)
    const now = new Date();
    const target = new Date(now);
    target.setUTCDate(target.getUTCDate() - daysAfter);
    const targetDay = target.toISOString().slice(0, 10);

    const appointments = await base44.asServiceRole.entities.Appointment.list();
    const clients = await base44.asServiceRole.entities.Client.list();
    const clientMap = {};
    clients.forEach((c) => { clientMap[c.id] = c; });

    const todays = appointments.filter(
      (a) => a.start && a.start.slice(0, 10) === targetDay
    );

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const subjectTpl = settings.review_subject || 'Votre avis nous intéresse';
    const htmlTpl = settings.review_html || DEFAULT_HTML;
    const reviewLink = settings.google_review_link || '';

    let sent = 0;
    const errors = [];

    for (const appt of todays) {
      const client = clientMap[appt.client_id];
      const email = extractEmail(appt.notes || appt.description);
      if (!email) continue;

      const dt = new Date(appt.start);
      const vars = {
        '{{client}}': client?.full_name || '',
        '{{date}}': dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        '{{heure}}': dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        '{{type}}': appt.intervention_type || '',
        '{{lien_avis}}': reviewLink,
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

    return Response.json({ targetDay, candidates: todays.length, sent, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});