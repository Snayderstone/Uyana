import { writable, derived } from 'svelte/store';
import type { UsuarioAutenticado } from '$lib/models/auth.model';

/**
 * Store para el usuario autenticado
 */
export const usuarioStore = writable<UsuarioAutenticado | null>(null);

/**
 * Store derivado: está autenticado
 */
export const estaAutenticado = derived(usuarioStore, ($usuario) => $usuario !== null);

/**
 * Store derivado: es administrador
 */
export const esAdmin = derived(usuarioStore, ($usuario) => {
	return $usuario?.roles.includes('Administrador') ?? false;
});

/**
 * Función para inicializar el usuario desde el servidor
 */
export function setUsuario(usuario: UsuarioAutenticado | null) {
	usuarioStore.set(usuario);
}

/**
 * Función para verificar si el usuario tiene un rol
 */
export function tieneRol(rol: string): boolean {
	let usuario: UsuarioAutenticado | null = null;
	usuarioStore.subscribe((u) => (usuario = u))();
	return usuario?.roles.includes(rol) ?? false;
}

/**
 * Función para login (actualiza el store después de login exitoso)
 */
export async function login(
	email: string,
	password: string
): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({ email, password })
		});

		const data = await response.json();

		if (data.success) {
			// Actualizar el store: preferimos confirmar con /api/auth/me
			await verificarAuth();
			return { success: true };
		} else {
			return { success: false, error: data.error };
		}
	} catch (error) {
		console.error('Error en login:', error);
		return { success: false, error: 'Error de conexión' };
	}
}

/**
 * Función para logout
 */
export async function logout(): Promise<void> {
	try {
		await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include'
		});

		// Limpiar el store
		usuarioStore.set(null);
	} catch (error) {
		console.error('Error en logout:', error);
	}
}

/**
 * Función para verificar autenticación actual
 */
export async function verificarAuth(): Promise<void> {
	try {
		const response = await fetch('/api/auth/me', { credentials: 'include' });
		const data = await response.json();

		if (data.success) {
			usuarioStore.set(data.usuario);
		} else {
			usuarioStore.set(null);
		}
	} catch (error) {
		console.error('Error al verificar auth:', error);
		usuarioStore.set(null);
	}
}
