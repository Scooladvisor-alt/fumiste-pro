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

function formatFr(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Jour anniversaire exact : la date tombe-t-elle exactement N mois avant aujourd'hui
// (même mois et même jour de calendrier) ?
function isAnniversary(dateStr, months) {
  if (!dateStr) return false;
  const target = new Date();
  target.setMonth(target.getMonth() - months);
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.getUTCFullYear() === target.getUTCFullYear()
    && d.getUTCMonth() === target.getUTCMonth()
    && d.getUTCDate() === target.getUTCDate();
}

// La date est-elle "due" : remonte-t-elle à au moins N mois (anniversaire atteint ou dépassé) ?
function isDue(dateStr, months) {
  if (!dateStr) return false;
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - months);
  threshold.setUTCHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.getTime() <= threshold.getTime();
}

// Extrait la première adresse e-mail présente dans un texte (notes de l'événement).
function extractEmail(text) {
  if (!text) return null;
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

// Envoie les relances entretien : ramonage (annuel) et test d'étanchéité (triennal).
// Anti-doublon via les champs *_sent_date du client.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // En mode manuel ("Envoyer maintenant"), on relance tout ce qui est dû (≥ N mois),
    // pas seulement les rendez-vous tombant pile au jour anniversaire.
    let manual = false;
    try {
      const body = await req.json();
      manual = body?.manual === true;
    } catch (_e) { /* pas de corps */ }

    const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
    const settings = settingsList[0] || {};

    const ramonageOn = settings.followup_enabled;

    const clients = await base44.asServiceRole.entities.Client.list();
    const appointments = await base44.asServiceRole.entities.Appointment.list();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const today = new Date().toISOString().slice(0, 10);

    const clientById = {};
    for (const c of clients) clientById[c.id] = c;

    const months = settings.followup_months ?? 12;

    const result = { ramonage: { sent: 0, candidates: 0 } };

    if (!ramonageOn) {
      return Response.json({ ...result, skipped: 'ramonage_disabled' });
    }

    // Parcourt les rendez-vous de type "ramonage" dont la date tombe exactement
    // au jour anniversaire (il y a N mois). Email = client rattaché ou extrait des notes.
    const seenEmails = new Set();
    for (const appt of appointments) {
      // "Ramonage" peut être dans le type d'intervention OU dans le titre du rendez-vous.
      const haystack = `${appt.intervention_type || ''} ${appt.title || ''}`.toLowerCase();
      if (!haystack.includes('ramonage')) continue;
      if (!appt.start) continue;

      const ramonageDate = appt.start.slice(0, 10);
      const matches = manual ? isDue(ramonageDate, months) : isAnniversary(ramonageDate, months);
      if (!matches) continue;

      const client = appt.client_id ? clientById[appt.client_id] : null;
      const email = client?.email || extractEmail(appt.notes);
      if (!email) continue;

      // Anti-doublon (même destinataire dans le même run)
      if (seenEmails.has(email.toLowerCase())) continue;
      seenEmails.add(email.toLowerCase());

      result.ramonage.candidates += 1;

      const subject = applyVars(settings.followup_subject, {
        '{{client}}': client?.full_name || '',
        '{client}': client?.full_name || '',
        '{{date_dernier_ramonage}}': formatFr(ramonageDate),
      });
      const html = applyVars(settings.followup_html, {
        '{{client}}': client?.full_name || '',
        '{{date_dernier_ramonage}}': formatFr(ramonageDate),
      });
      const raw = buildMime({ to: email, subject, html });
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw }),
      });
      if (res.ok) {
        result.ramonage.sent += 1;
        if (client) {
          await base44.asServiceRole.entities.Client.update(client.id, { followup_sent_date: today });
        }
      }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});