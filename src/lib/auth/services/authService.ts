import { supabase } from '$lib/supabase';
import { authStore } from '../stores/authStore';
import { logger, pickClientMeta } from '../utils/logger';
import { auditRepository } from '$lib/db/auditRepository';
import { roleService } from './roleService';

export const authService = {
  async login(email: string, password: string) {
    authStore.update((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      authStore.update((s) => ({ ...s, loading: false, error: 'Credenciales inválidas' }));
      logger.warn('login_failed', { email, error: error.message });
      return { ok: false, error };
    }

    const user = data.user;
    const profile = await fetchProfile(user.id);
    const roles = await roleService.fetchRoles(user.id);

    authStore.set({
      user: { id: user.id, email: user.email ?? '', full_name: profile?.full_name },
      roles,
      loading: false,
      error: null
    });

    // Log auditoría (login)
    await auditRepository.log({
      accion: 'login',
      usuario_id: user.id,
      tabla_afectada: null,
      registro_id: null,
      valores_nuevos: { email: user.email },
      ip: null,
      user_agent: pickClientMeta().userAgent
    });

    logger.info('login_success', { user_id: user.id, roles });
    return { ok: true };
  },

  async logout() {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.auth.signOut();

    if (user?.id) {
      await auditRepository.log({
        accion: 'logout',
        usuario_id: user.id,
        tabla_afectada: null,
        registro_id: null,
        valores_nuevos: null,
        ip: null,
        user_agent: pickClientMeta().userAgent
      });
    }

    authStore.set({ user: null, roles: [], loading: false, error: null });
    logger.info('logout_success');
  }
};

async function fetchProfile(user_id: string) {
  const { data } = await supabase.from('profiles').select('*').eq('user_id', user_id).single();
  return data;
}
