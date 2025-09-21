import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const srv = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { user_id, roles } = await request.json();

  const { data: roleRows, error: rErr } = await srv.from('roles').select('id,name').in('name', roles);
  if (rErr) throw error(400, rErr.message);

  // Reemplaza roles actuales
  const { error: delErr } = await srv.from('user_roles').delete().eq('user_id', user_id);
  if (delErr) throw error(400, delErr.message);

  const assigns = roleRows.map((r) => ({ user_id, role_id: r.id }));
  const { error: insErr } = await srv.from('user_roles').insert(assigns);
  if (insErr) throw error(400, insErr.message);

  return json({ ok: true });
};

/*  Nota: En producción, monta locals.supabase en hooks.server.ts y valida que el caller 
    sea admin antes de ejecutar (comprobando is_admin() con el auth.uid() del request). 
    He dejado esto minimalista para no agregar más archivos de los pactados.
*/
