import { redirect } from '@sveltejs/kit';
import { verifyAuth } from '$lib/utils/auth.utils';
import type { LayoutServerLoad } from './$types';

/**
 * Hook de protección para rutas de administración
 * Se ejecuta en cada carga de página bajo /admin
 */
export const load: LayoutServerLoad = async (event) => {
	// Excluir la ruta de login de la protección
	if (event.url.pathname === '/login') {
		return {
			usuario: null,
			url: event.url.pathname
		};
	}

	// Verificar autenticación
	const usuario = await verifyAuth(event);

	// Si no está autenticado, redirigir al login
	if (!usuario) {
		throw redirect(302, '/login');
	}

	// Verificar que sea administrador
	if (!usuario.roles.includes('Administrador')) {
		throw redirect(302, '/');
	}

	// Retornar usuario para las páginas hijas
	return {
		usuario,
		url: event.url.pathname
	};
};
