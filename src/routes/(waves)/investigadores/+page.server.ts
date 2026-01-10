// Ruta deshabilitada - tabla investigadores_uce_def del sistema anterior ya no existe

// Deshabilitar prerendering para esta página
export const prerender = false;
export const ssr = true;

export async function load() {
	// Retornar array vacío - esta funcionalidad usa tabla antigua
	return {
		investigadores: []
	};
}
