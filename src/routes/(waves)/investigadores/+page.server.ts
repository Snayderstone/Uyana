import { obtenerInvestigadores } from '$lib/supabase';

export async function load() {
	// Obtener los investigadores desde Supabase
	const investigadores = await obtenerInvestigadores();

	return {
		investigadores
	};
}
