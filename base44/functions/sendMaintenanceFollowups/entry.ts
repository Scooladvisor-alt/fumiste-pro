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

// La date remonte-t-elle à au moins N mois (échéance atteinte ou dépassée) ?
function isDue(dateStr, months) {
  if (!dateStr) return false;
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - months);
  threshold.setUTCHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.getTime() <= threshold.getTime();
}

// Envoie un e-mail Gmail. Renvoie true si l'envoi a réussi.
async function sendEmail(authHeader, { to, subject, html }) {
  const raw = buildMime({ to, subject, html });
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({ raw }),
  });
  return res.ok;
}

// Relances entretien basées UNIQUEMENT sur les colonnes client :
//  - last_ramonage_date    : relance ramonage si ≥ followup_months (12 par défaut)
//  - last_etancheite_date  : relance étanchéité si ≥ etancheite_followup_months (36 par défaut)
// Anti-doublon : on ne renvoie pas si une relance a déjà été envoyée depuis la dernière échéance.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
    const settings = settingsList[0] || {};

    const ramonageOn = settings.followup_enabled;
    const etancheiteOn = settings.etancheite_followup_enabled;

    const ramonageMonths = settings.followup_months ?? 12;
    const etancheiteMonths = settings.etancheite_followup_months ?? 36;

    const result = {
      ramonage: { sent: 0, candidates: 0 },
      etancheite: { sent: 0, candidates: 0 },
    };

    if (!ramonageOn && !etancheiteOn) {
      return Response.json({ ...result, skipped: 'all_disabled' });
    }

    const clients = await base44.asServiceRole.entities.Client.list();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const today = new Date().toISOString().slice(0, 10);

    for (const client of clients) {
      if (!client.email) continue;

      // --- Ramonage ---
      if (ramonageOn && isDue(client.last_ramonage_date, ramonageMonths)) {
        // Anti-doublon : déjà relancé depuis le dernier ramonage ?
        const alreadySent = client.followup_sent_date
          && client.followup_sent_date >= client.last_ramonage_date;
        if (!alreadySent) {
          result.ramonage.candidates += 1;
          const subject = applyVars(settings.followup_subject, {
            '{{client}}': client.full_name || '',
            '{{date_dernier_ramonage}}': formatFr(client.last_ramonage_date),
          });
          const html = applyVars(settings.followup_html, {
            '{{client}}': client.full_name || '',
            '{{date_dernier_ramonage}}': formatFr(client.last_ramonage_date),
          });
          if (await sendEmail(authHeader, { to: client.email, subject, html })) {
            result.ramonage.sent += 1;
            await base44.asServiceRole.entities.Client.update(client.id, { followup_sent_date: today });
          }
        }
      }

      // --- Test d'étanchéité ---
      if (etancheiteOn && isDue(client.last_etancheite_date, etancheiteMonths)) {
        const alreadySent = client.etancheite_followup_sent_date
          && client.etancheite_followup_sent_date >= client.last_etancheite_date;
        if (!alreadySent) {
          result.etancheite.candidates += 1;
          const subject = applyVars(settings.etancheite_followup_subject, {
            '{{client}}': client.full_name || '',
            '{{date_dernier_test}}': formatFr(client.last_etancheite_date),
          });
          const html = applyVars(settings.etancheite_followup_html, {
            '{{client}}': client.full_name || '',
            '{{date_dernier_test}}': formatFr(client.last_etancheite_date),
          });
          if (await sendEmail(authHeader, { to: client.email, subject, html })) {
            result.etancheite.sent += 1;
            await base44.asServiceRole.entities.Client.update(client.id, { etancheite_followup_sent_date: today });
          }
        }
      }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});