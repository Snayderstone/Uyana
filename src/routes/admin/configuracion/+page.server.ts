import type { PageServerLoad } from './$types';

/**
 * Cargar datos del usuario para la página de configuración
 */
export const load: PageServerLoad = async ({ parent }) => {
	// Obtener datos del layout padre (que incluye el usuario autenticado)
	const { usuario } = await parent();

	return {
		usuario
	};
};
