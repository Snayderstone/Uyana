import { supabase } from '$lib/supabase';

export const roleRepository = {
  async listRoles() {
    const { data, error } = await supabase.from('roles').select('*').order('id');
    if (error) throw error;
    return data;
  }
};
