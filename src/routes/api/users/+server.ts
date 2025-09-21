import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';

// Crear usuario en Auth + profile + roles
export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
  // Verifica que quien llama es admin (su cookie de sesión se valida con locals.supabase si la tienes montada;
  // si no, valida con un token Bearer o haz un fetch a la BD para comprobar).
  // Aquí haremos una verificación simple por token de sesión vía header opcional:
  // Recomendado: montar handle de Supabase en hooks para tener locals.supabase.

  const srv = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { email, password, full_name, roles } = await request.json();

  // Crea usuario en Auth
  const { data: created, error: adminErr } = await srv.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (adminErr || !created.user) {
    throw error(400, adminErr?.message ?? 'No se pudo crear el usuario');
  }

  const user_id = created.user.id;

  // Inserta profile
  const { error: profileErr } = await srv.from('profiles').insert({
    user_id,
    email,
    full_name: full_name ?? ''
  });
  if (profileErr) throw error(400, profileErr.message);

  // Asigna roles
  if (Array.isArray(roles) && roles.length) {
    const { data: roleRows, error: rErr } = await srv.from('roles').select('id,name').in('name', roles);
    if (rErr) throw error(400, rErr.message);
    const assigns = roleRows.map((r) => ({ user_id, role_id: r.id }));
    const { error: urErr } = await srv.from('user_roles').insert(assigns);
    if (urErr) throw error(400, urErr.message);
  }

  return json({ ok: true, user_id });
};
