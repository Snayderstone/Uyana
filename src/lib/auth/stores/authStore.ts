import { writable, derived } from 'svelte/store';

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
};

export type AuthState = {
  user: AuthUser | null;
  roles: string[];     // ['admin', 'investigador', ...]
  loading: boolean;
  error: string | null;
};

const initial: AuthState = { user: null, roles: [], loading: false, error: null };

export const authStore = writable<AuthState>(initial);

export const isLoggedIn = derived(authStore, ($s) => !!$s.user);
export const isAdmin    = derived(authStore, ($s) => $s.roles.includes('admin'));
export const hasRole    = (role: string) =>
  derived(authStore, ($s) => $s.roles.includes(role));
