import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Vérifie le code d'accès partagé et débloque l'espace de l'utilisateur courant.
// Le code n'est jamais exposé au frontend : il est comparé côté serveur au secret ACCESS_CODE.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, plan } = await req.json();
    const expected = Deno.env.get('ACCESS_CODE');

    if (!code || code.trim() !== expected) {
      return Response.json({ ok: false, error: 'invalid_code' }, { status: 200 });
    }

    const chosenPlan = plan === 'sms' ? 'sms' : 'simple';
    const nowIso = new Date().toISOString();

    // Un seul AccessGrant par utilisateur (RLS limite déjà à l'utilisateur courant)
    const existing = await base44.entities.AccessGrant.list();
    if (existing.length > 0) {
      await base44.entities.AccessGrant.update(existing[0].id, {
        unlocked_at: existing[0].unlocked_at || nowIso,
        plan: chosenPlan,
      });
    } else {
      await base44.entities.AccessGrant.create({
        unlocked_at: nowIso,
        plan: chosenPlan,
      });
    }

    return Response.json({ ok: true, plan: chosenPlan });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});