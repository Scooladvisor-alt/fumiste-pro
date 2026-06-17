import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CALENDAR_CONNECTOR_ID = '6a32cbfde2927ef1458ec237';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CALENDAR_CONNECTOR_ID);
      const connected = !!conn?.accessToken;
      return Response.json({ connected });
    } catch {
      return Response.json({ connected: false });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});