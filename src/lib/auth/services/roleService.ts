import { supabase } from '$lib/supabase';

export const roleService = {
  async fetchRoles(user_id: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user_id);

    if (error || !data) return [];
    // data = [{ roles: { name: 'admin' }}, ...]
    return data.map((r: any) => r.roles?.name).filter(Boolean);
  },

  isAdmin(roles: string[]) {
    return roles.includes('admin');
  },

  isInvestigator(roles: string[]) {
    return roles.includes('investigador');
  }
};
