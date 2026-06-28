import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GMAIL_CONNECTOR_ID = '6a32cc1aff5b6c91aa8e022a';

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

function formatFr(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Jour calendaire (YYYY-MM-DD) d'une date, exprimé en heure de Paris.
// Indispensable : les rendez-vous sont stockés tantôt en UTC, tantôt avec offset,
// donc un simple .slice(0,10) sur la chaîne brute se trompe de jour.
function parisDay(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  // en-CA => format YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

// Jour cible (heure de Paris) décalé de `days` jours par rapport à aujourd'hui.
function dayOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return parisDay(d);
}

function isDue(dateStr, months) {
  if (!dateStr) return false;
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - months);
  threshold.setUTCHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.getTime() <= threshold.getTime();
}

// Envoi MANUEL : déclenché par l'utilisateur depuis l'app.
// Utilise le Gmail de l'utilisateur connecté et ne traite QUE ses propres données (RLS).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mode mono-utilisateur : connexion native PARTAGÉE Gmail (compte Google du propriétaire de l'app).
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

    const body = await req.json().catch(() => ({}));
    const isAuto = body?.auto === true;
    // force = true : le bouton "Envoyer maintenant" ignore l'anti-doublon du jour (utile pour tester / renvoyer).
    const force = body?.force === true;

    // Base de l'URL des fonctions, pour construire le lien du bouton de confirmation.
    const appId = Deno.env.get('BASE44_APP_ID');
    const origin = new URL(req.url).origin;
    const confirmBase = `${origin}/api/apps/${appId}/functions/confirmAttendance`;

    // Site mono-utilisateur : on utilise TOUJOURS la fiche de réglages la plus complète,
    // peu importe le compte connecté (évite de tomber sur une fiche vide créée par un autre compte de test).
    const allSettings = await base44.asServiceRole.entities.ReminderSettings.list();
    function settingsScore(s) {
      let n = 0;
      if (s.review_enabled) n += 1;
      if (s.google_review_link) n += 1;
      if (s.followup_enabled) n += 1;
      if (s.company_name) n += 1;
      if (s.reminder_html) n += 1;
      if (s.onboarding_completed) n += 1;
      return n;
    }
    const settings = allSettings.slice().sort((a, b) => settingsScore(b) - settingsScore(a))[0] || {};

    const todayCheck = new Date().toISOString().slice(0, 10);
    // Envoi AUTO : maximum une fois par jour. Si déjà fait aujourd'hui, on stoppe.
    if (isAuto && settings.auto_send_last_run === todayCheck) {
      return Response.json({ ok: true, skipped: 'already_sent_today', totalSent: 0 });
    }
    const appointments = await base44.entities.Appointment.list();
    const clients = await base44.entities.Client.list();
    const clientMap = {};
    clients.forEach((c) => { clientMap[c.id] = c; });

    const today = new Date().toISOString().slice(0, 10);

    // Anti-doublon : e-mails déjà envoyés aujourd'hui (rappel / avis) à une adresse donnée.
    // Basé sur le destinataire e-mail (unique par RDV) et non sur client_id, car les
    // rendez-vous synchronisés depuis Google n'ont pas de client_id (=> sinon un seul envoi).
    const todaysLogs = await base44.entities.CommunicationLog.filter({ sent_date: today });
    const sentTodayKey = new Set(todaysLogs.map((l) => `${l.type}:${(l.to || '').toLowerCase()}`));

    async function sendEmail({ to, subject, html }) {
      const raw = buildMime({ to, subject, html });
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw }),
      });
      return res.ok;
    }

    async function sendBatch({ targetDay, subjectTpl, htmlTpl, logType, extraVars = {} }) {
      const targets = appointments.filter((a) => a.start && parisDay(a.start) === targetDay);
      let sent = 0;
      for (const appt of targets) {
        const client = clientMap[appt.client_id];
        const email = extractEmail(appt.notes || appt.description);
        if (!email) continue;
        // Déjà envoyé aujourd'hui à cette adresse pour ce type ? on saute (sauf renvoi forcé).
        const dedupKey = `${logType}:${email.toLowerCase()}`;
        if (!force && sentTodayKey.has(dedupKey)) continue;
        const dt = new Date(appt.start);
        const vars = {
          '{{client}}': client?.full_name || '',
          '{{date}}': dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          '{{heure}}': dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          '{{type}}': appt.intervention_type || '',
          '{{lien_confirmation}}': `${confirmBase}?appt=${appt.id}`,
          ...extraVars,
        };
        const subject = applyVars(subjectTpl, vars);
        const html = applyVars(htmlTpl, vars);
        if (await sendEmail({ to: email, subject, html })) {
          sent += 1;
          sentTodayKey.add(dedupKey);
          await base44.entities.CommunicationLog.create({
            type: logType,
            channel: 'email',
            client_id: appt.client_id || '',
            client_name: client?.full_name || '',
            to: email,
            sent_date: today,
          });
        }
      }
      return { candidates: targets.length, sent };
    }

    const result = { reminders: { candidates: 0, sent: 0 }, reviews: { candidates: 0, sent: 0 }, ramonage: { candidates: 0, sent: 0 }, etancheite: { candidates: 0, sent: 0 } };
    // Explications par catégorie : pourquoi 0 e-mail (option éteinte, lien manquant, aucun RDV concerné).
    const reasons = [];

    // Rappels d'intervention (J - days_before)
    if (settings.enabled !== false) {
      const daysBefore = settings.days_before ?? 2;
      result.reminders = await sendBatch({
        targetDay: dayOffset(daysBefore),
        subjectTpl: settings.reminder_subject || 'Rappel : votre intervention approche',
        htmlTpl: settings.reminder_html || '<p>Bonjour {{client}}, rappel de votre intervention {{type}} le {{date}} à {{heure}}.</p>',
        logType: 'rappel',
      });
      if (result.reminders.sent === 0) {
        reasons.push(result.reminders.candidates === 0
          ? `Rappels : aucun rendez-vous prévu dans ${daysBefore} jour(s).`
          : `Rappels : ${result.reminders.candidates} rendez-vous concerné(s) mais aucun e-mail trouvé dans la description (ou déjà envoyé aujourd'hui).`);
      }
    } else {
      reasons.push('Rappels : option désactivée dans vos réglages.');
    }

    // Demandes d'avis Google (J + review_days_after)
    if (settings.review_enabled) {
      const daysAfter = settings.review_days_after ?? 1;
      if (!settings.google_review_link) {
        reasons.push('Avis Google : aucun lien Google d\'avis renseigné dans vos réglages.');
      } else {
        result.reviews = await sendBatch({
          targetDay: dayOffset(-daysAfter),
          subjectTpl: settings.review_subject || 'Votre avis nous intéresse',
          htmlTpl: settings.review_html || '<p>Bonjour {{client}}, <a href="{{lien_avis}}">laissez un avis</a>.</p>',
          logType: 'avis',
          extraVars: { '{{lien_avis}}': settings.google_review_link || '' },
        });
        if (result.reviews.sent === 0) {
          reasons.push(result.reviews.candidates === 0
            ? `Avis Google : aucun rendez-vous terminé il y a ${daysAfter} jour(s).`
            : `Avis Google : ${result.reviews.candidates} rendez-vous concerné(s) mais aucun e-mail trouvé dans la description (ou déjà envoyé aujourd'hui).`);
        }
      }
    } else {
      reasons.push('Avis Google : option désactivée dans vos réglages.');
    }

    // Relances entretien (ramonage annuel / étanchéité triennale) basées sur les colonnes client
    const ramonageMonths = settings.followup_months ?? 12;
    const etancheiteMonths = settings.etancheite_followup_months ?? 36;
    if (!settings.followup_enabled) reasons.push('Relance ramonage : option désactivée dans vos réglages.');
    if (!settings.etancheite_followup_enabled) reasons.push('Relance étanchéité : option désactivée dans vos réglages.');

    for (const client of clients) {
      if (!client.email) continue;

      if (settings.followup_enabled && isDue(client.last_ramonage_date, ramonageMonths)) {
        const alreadySent = !force && client.followup_sent_date && client.followup_sent_date >= client.last_ramonage_date;
        if (!alreadySent) {
          result.ramonage.candidates += 1;
          const v = { '{{client}}': client.full_name || '', '{{date_dernier_ramonage}}': formatFr(client.last_ramonage_date) };
          const subject = applyVars(settings.followup_subject, v);
          const html = applyVars(settings.followup_html, v);
          if (await sendEmail({ to: client.email, subject, html })) {
            result.ramonage.sent += 1;
            await base44.entities.Client.update(client.id, { followup_sent_date: today });
            await base44.entities.CommunicationLog.create({
              type: 'relance_ramonage', channel: 'email', client_id: client.id,
              client_name: client.full_name || '', to: client.email, sent_date: today,
            });
          }
        }
      }

      if (settings.etancheite_followup_enabled && isDue(client.last_etancheite_date, etancheiteMonths)) {
        const alreadySent = !force && client.etancheite_followup_sent_date && client.etancheite_followup_sent_date >= client.last_etancheite_date;
        if (!alreadySent) {
          result.etancheite.candidates += 1;
          const v = { '{{client}}': client.full_name || '', '{{date_dernier_test}}': formatFr(client.last_etancheite_date) };
          const subject = applyVars(settings.etancheite_followup_subject, v);
          const html = applyVars(settings.etancheite_followup_html, v);
          if (await sendEmail({ to: client.email, subject, html })) {
            result.etancheite.sent += 1;
            await base44.entities.Client.update(client.id, { etancheite_followup_sent_date: today });
            await base44.entities.CommunicationLog.create({
              type: 'relance_etancheite', channel: 'email', client_id: client.id,
              client_name: client.full_name || '', to: client.email, sent_date: today,
            });
          }
        }
      }
    }

    const totalSent = result.reminders.sent + result.reviews.sent + result.ramonage.sent + result.etancheite.sent;
    if (settings.followup_enabled && result.ramonage.sent === 0) {
      reasons.push('Relance ramonage : aucun client dont le dernier ramonage dépasse le délai configuré.');
    }
    if (settings.etancheite_followup_enabled && result.etancheite.sent === 0) {
      reasons.push('Relance étanchéité : aucun client dont le dernier test dépasse le délai configuré.');
    }

    // Marque l'exécution du jour (anti-doublon de l'envoi auto à l'ouverture).
    if (settings.id) {
      await base44.asServiceRole.entities.ReminderSettings.update(settings.id, { auto_send_last_run: todayCheck });
    }

    return Response.json({ ok: true, totalSent, reasons, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});