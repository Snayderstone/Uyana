import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	// En un entorno de producción, aquí añadirías una comprobación de autenticación
	// con el sistema de auth que uses (Supabase, Auth.js, etc.)

	// Por ahora, permitimos acceso sin restricción para desarrollo
	return {
		url: url.pathname
	};
};
