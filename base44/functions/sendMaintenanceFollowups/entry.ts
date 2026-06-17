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

// Une date "il y a N mois ou plus" (échue) ?
function isDue(dateStr, months) {
  if (!dateStr) return false;
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - months);
  return new Date(dateStr) <= threshold;
}

// Envoie les relances entretien : ramonage (annuel) et test d'étanchéité (triennal).
// Anti-doublon via les champs *_sent_date du client.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
    const settings = settingsList[0] || {};

    const ramonageOn = settings.followup_enabled;
    const etancheiteOn = settings.etancheite_followup_enabled;
    if (!ramonageOn && !etancheiteOn) {
      return Response.json({ skipped: true, reason: 'disabled' });
    }

    const clients = await base44.asServiceRole.entities.Client.list();
    const appointments = await base44.asServiceRole.entities.Appointment.list();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const today = new Date().toISOString().slice(0, 10);

    // Calcule, par client, la dernière date (YYYY-MM-DD) de ramonage et de test d'étanchéité
    // directement depuis les rendez-vous passés (plus fiable que le champ stocké sur le client).
    const lastByClient = {};
    for (const appt of appointments) {
      if (!appt.client_id || !appt.start) continue;
      const type = (appt.intervention_type || '').toLowerCase();
      let key = null;
      if (type.includes('ramonage')) key = 'ramonage';
      else if (type.includes('étanch') || type.includes('etanch')) key = 'etancheite';
      if (!key) continue;
      const date = appt.start.slice(0, 10);
      if (date > today) continue; // ignore les rendez-vous futurs
      const entry = (lastByClient[appt.client_id] = lastByClient[appt.client_id] || {});
      if (!entry[key] || date > entry[key]) entry[key] = date;
    }

    async function sendOne(client, subjectTpl, htmlTpl, vars) {
      const email = client.email;
      if (!email) return false;
      const subject = applyVars(subjectTpl, vars);
      const html = applyVars(htmlTpl, vars);
      const raw = buildMime({ to: email, subject, html });
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw }),
      });
      return res.ok;
    }

    const result = { ramonage: { sent: 0, candidates: 0 }, etancheite: { sent: 0, candidates: 0 } };

    for (const client of clients) {
      const computed = lastByClient[client.id] || {};

      // --- Ramonage (annuel) ---
      if (ramonageOn) {
        const months = settings.followup_months ?? 12;
        // Date de référence : la plus récente entre le champ client et le calcul depuis les RDV.
        const ramonageDate = [client.last_ramonage_date, computed.ramonage]
          .filter(Boolean)
          .sort()
          .pop();
        const due = isDue(ramonageDate, months);
        // Anti-doublon : ne pas renvoyer si déjà relancé après le dernier ramonage
        const alreadySent = client.followup_sent_date && client.followup_sent_date > ramonageDate;
        if (due && !alreadySent) {
          result.ramonage.candidates += 1;
          const ok = await sendOne(client, settings.followup_subject, settings.followup_html, {
            '{{client}}': client.full_name || '',
            '{{date_dernier_ramonage}}': formatFr(ramonageDate),
          });
          if (ok) {
            await base44.asServiceRole.entities.Client.update(client.id, { followup_sent_date: today });
            result.ramonage.sent += 1;
          }
        }
      }

      // --- Test d'étanchéité (triennal) ---
      if (etancheiteOn) {
        const months = settings.etancheite_followup_months ?? 36;
        const etancheiteDate = [client.last_etancheite_date, computed.etancheite]
          .filter(Boolean)
          .sort()
          .pop();
        const due = isDue(etancheiteDate, months);
        const alreadySent = client.etancheite_followup_sent_date && client.etancheite_followup_sent_date > etancheiteDate;
        if (due && !alreadySent) {
          result.etancheite.candidates += 1;
          const ok = await sendOne(client, settings.etancheite_followup_subject, settings.etancheite_followup_html, {
            '{{client}}': client.full_name || '',
            '{{date_dernier_test}}': formatFr(etancheiteDate),
          });
          if (ok) {
            await base44.asServiceRole.entities.Client.update(client.id, { etancheite_followup_sent_date: today });
            result.etancheite.sent += 1;
          }
        }
      }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});