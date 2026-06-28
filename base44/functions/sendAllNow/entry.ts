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

// BOUTON ULTIME : envoie le rappel d'intervention à TOUS les rendez-vous qui ont une adresse e-mail.
// Aucune règle de date, aucun anti-doublon — il passe au-dessus de tout.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gmail partagé (compte Google du propriétaire de l'app).
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn?.accessToken;
    } catch {
      accessToken = null;
    }
    if (!accessToken) {
      return Response.json({ error: 'gmail_not_connected' }, { status: 400 });
    }
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Réglages les plus complets (mono-utilisateur).
    const allSettings = await base44.asServiceRole.entities.ReminderSettings.list();
    function settingsScore(s) {
      let n = 0;
      if (s.reminder_html) n += 1;
      if (s.company_name) n += 1;
      if (s.onboarding_completed) n += 1;
      return n;
    }
    const settings = allSettings.slice().sort((a, b) => settingsScore(b) - settingsScore(a))[0] || {};

    const appId = Deno.env.get('BASE44_APP_ID');
    const origin = new URL(req.url).origin;
    const confirmBase = `${origin}/api/apps/${appId}/functions/confirmAttendance`;

    const appointments = await base44.asServiceRole.entities.Appointment.list();
    const clients = await base44.asServiceRole.entities.Client.list();
    const clientMap = {};
    clients.forEach((c) => { clientMap[c.id] = c; });

    const today = new Date().toISOString().slice(0, 10);
    const subjectTpl = settings.reminder_subject || 'Rappel : votre intervention approche';
    const htmlTpl = settings.reminder_html || '<p>Bonjour {{client}}, rappel de votre intervention {{type}} le {{date}} à {{heure}}.</p>';

    let sent = 0;
    let noEmail = 0;
    const errors = [];

    for (const appt of appointments) {
      const client = clientMap[appt.client_id];
      const email = extractEmail(appt.notes || appt.description) || client?.email;
      if (!email) { noEmail += 1; continue; }

      const dt = appt.start ? new Date(appt.start) : null;
      const vars = {
        '{{client}}': client?.full_name || '',
        '{{date}}': dt ? dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '',
        '{{heure}}': dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
        '{{type}}': appt.intervention_type || '',
        '{{lien_confirmation}}': `${confirmBase}?appt=${appt.id}`,
      };
      const subject = applyVars(subjectTpl, vars);
      const html = applyVars(htmlTpl, vars);
      const raw = buildMime({ to: email, subject, html });

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw }),
      });

      if (res.ok) {
        sent += 1;
        await base44.asServiceRole.entities.CommunicationLog.create({
          type: 'rappel',
          channel: 'email',
          client_id: appt.client_id || '',
          client_name: client?.full_name || '',
          to: email,
          sent_date: today,
        });
      } else {
        errors.push(`${email}: ${res.status}`);
      }
    }

    return Response.json({ ok: true, totalSent: sent, totalAppointments: appointments.length, noEmail, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});