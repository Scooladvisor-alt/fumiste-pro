import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Mode mono-utilisateur : on utilise l'intégration native PARTAGÉE Gmail
// (le compte Google du propriétaire de l'app, connecté une seule fois côté Base44).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      const connected = !!conn?.accessToken;
      return Response.json({ connected });
    } catch {
      return Response.json({ connected: false });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});