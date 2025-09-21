import { supabase } from '$lib/supabase';
import { authStore } from '../stores/authStore';
import { roleService } from './roleService';

export const sessionService = {
  init() {
    // Cargar sesión al arrancar
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const user = data.session.user;
      const profile = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      const roles = await roleService.fetchRoles(user.id);
      authStore.set({
        user: { id: user.id, email: user.email ?? '', full_name: profile.data?.full_name },
        roles,
        loading: false,
        error: null
      });
    });

    // Suscripción cambios de sesión
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        authStore.set({ user: null, roles: [], loading: false, error: null });
        return;
      }
      const user = session.user;
      const profile = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      const roles = await roleService.fetchRoles(user.id);
      authStore.set({
        user: { id: user.id, email: user.email ?? '', full_name: profile.data?.full_name },
        roles,
        loading: false,
        error: null
      });
    });
  }
};
