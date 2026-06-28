import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AUTOMATISATION QUOTIDIENNE (sans utilisateur connecté).
// Exécute en service role l'intégralité du traitement journalier :
//   - rappels d'intervention (J - days_before)
//   - demandes d'avis Google (fenêtre J+1 ... J+review_days_after passés)
//   - relances ramonage (annuelle) et étanchéité (triennale)
// Application mono-utilisateur : on lit le compte Gmail PARTAGÉ et l'unique fiche de réglages.

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

function parisDay(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Gmail PARTAGÉ (compte Google du propriétaire de l'app).
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

    const appId = Deno.env.get('BASE44_APP_ID');
    const origin = new URL(req.url).origin;
    const confirmBase = `${origin}/api/apps/${appId}/functions/confirmAttendance`;

    // Fiche de réglages la plus complète (mono-utilisateur).
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

    // L'automatisation tourne toutes les heures, mais le traitement ne s'exécute
    // QU'À l'heure configurée dans « Heure de passage quotidien » (fuseau Europe/Paris).
    // C'est la SEULE source de vérité : changer l'heure dans les réglages suffit.
    // `force: true` permet de tester manuellement en ignorant cette garde.
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;
    const currentParisHour = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', hour: '2-digit', hour12: false,
    }).format(new Date()).slice(0, 2));
    const sendHour = settings.daily_send_hour ?? 9;
    const todayParis = parisDay(new Date());

    if (!force) {
      if (currentParisHour !== sendHour) {
        return Response.json({ ok: true, skipped: 'not_send_hour', currentParisHour, sendHour, totalSent: 0 });
      }
      if (settings.auto_send_last_run === todayParis) {
        return Response.json({ ok: true, skipped: 'already_sent_today', totalSent: 0 });
      }
    }

    const appointments = await base44.asServiceRole.entities.Appointment.list();
    const clients = await base44.asServiceRole.entities.Client.list();
    const clientMap = {};
    clients.forEach((c) => { clientMap[c.id] = c; });

    const today = new Date().toISOString().slice(0, 10);

    // Anti-doublon : e-mails déjà envoyés aujourd'hui (par type + destinataire).
    const todaysLogs = await base44.asServiceRole.entities.CommunicationLog.filter({ sent_date: today });
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

    async function sendBatch({ targetDay, fromDay, toDay, subjectTpl, htmlTpl, logType, extraVars = {} }) {
      const targets = appointments.filter((a) => {
        if (!a.start) return false;
        const day = parisDay(a.start);
        if (targetDay) return day === targetDay;
        return day >= fromDay && day <= toDay;
      });
      let sent = 0;
      for (const appt of targets) {
        const client = clientMap[appt.client_id];
        const email = extractEmail(appt.notes || appt.description);
        if (!email) continue;
        const dedupKey = `${logType}:${email.toLowerCase()}`;
        if (sentTodayKey.has(dedupKey)) continue;
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
          await base44.asServiceRole.entities.CommunicationLog.create({
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

    // 1) Rappels d'intervention (J - days_before)
    if (settings.enabled !== false) {
      const daysBefore = settings.days_before ?? 2;
      result.reminders = await sendBatch({
        targetDay: dayOffset(daysBefore),
        subjectTpl: settings.reminder_subject || 'Rappel : votre intervention approche',
        htmlTpl: settings.reminder_html || '<p>Bonjour {{client}}, rappel de votre intervention {{type}} le {{date}} à {{heure}}.</p>',
        logType: 'rappel',
      });
    }

    // 2) Demandes d'avis Google (rendez-vous terminés, J+1 ... J+review_days_after)
    if (settings.review_enabled && settings.google_review_link) {
      const daysAfter = settings.review_days_after ?? 1;
      result.reviews = await sendBatch({
        fromDay: dayOffset(-daysAfter),
        toDay: dayOffset(-1),
        subjectTpl: settings.review_subject || 'Votre avis nous intéresse',
        htmlTpl: settings.review_html || '<p>Bonjour {{client}}, <a href="{{lien_avis}}">laissez un avis</a>.</p>',
        logType: 'avis',
        extraVars: { '{{lien_avis}}': settings.google_review_link || '' },
      });
    }

    // 3) Relances entretien (ramonage annuel / étanchéité triennale)
    const ramonageMonths = settings.followup_months ?? 12;
    const etancheiteMonths = settings.etancheite_followup_months ?? 36;
    for (const client of clients) {
      if (!client.email) continue;

      if (settings.followup_enabled && isDue(client.last_ramonage_date, ramonageMonths)) {
        const alreadySent = client.followup_sent_date && client.followup_sent_date >= client.last_ramonage_date;
        if (!alreadySent) {
          result.ramonage.candidates += 1;
          const v = { '{{client}}': client.full_name || '', '{{date_dernier_ramonage}}': formatFr(client.last_ramonage_date) };
          const subject = applyVars(settings.followup_subject, v);
          const html = applyVars(settings.followup_html, v);
          if (await sendEmail({ to: client.email, subject, html })) {
            result.ramonage.sent += 1;
            await base44.asServiceRole.entities.Client.update(client.id, { followup_sent_date: today });
            await base44.asServiceRole.entities.CommunicationLog.create({
              type: 'relance_ramonage', channel: 'email', client_id: client.id,
              client_name: client.full_name || '', to: client.email, sent_date: today,
            });
          }
        }
      }

      if (settings.etancheite_followup_enabled && isDue(client.last_etancheite_date, etancheiteMonths)) {
        const alreadySent = client.etancheite_followup_sent_date && client.etancheite_followup_sent_date >= client.last_etancheite_date;
        if (!alreadySent) {
          result.etancheite.candidates += 1;
          const v = { '{{client}}': client.full_name || '', '{{date_dernier_test}}': formatFr(client.last_etancheite_date) };
          const subject = applyVars(settings.etancheite_followup_subject, v);
          const html = applyVars(settings.etancheite_followup_html, v);
          if (await sendEmail({ to: client.email, subject, html })) {
            result.etancheite.sent += 1;
            await base44.asServiceRole.entities.Client.update(client.id, { etancheite_followup_sent_date: today });
            await base44.asServiceRole.entities.CommunicationLog.create({
              type: 'relance_etancheite', channel: 'email', client_id: client.id,
              client_name: client.full_name || '', to: client.email, sent_date: today,
            });
          }
        }
      }
    }

    const totalSent = result.reminders.sent + result.reviews.sent + result.ramonage.sent + result.etancheite.sent;

    // Marque l'exécution du jour (anti-doublon : une seule passe quotidienne).
    if (!force && settings.id) {
      await base44.asServiceRole.entities.ReminderSettings.update(settings.id, { auto_send_last_run: todayParis });
    }

    return Response.json({ ok: true, totalSent, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});