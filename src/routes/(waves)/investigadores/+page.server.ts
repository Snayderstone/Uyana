import { obtenerInvestigadores } from '$lib/services/investigator.service';

export async function load() {
	// Obtener los investigadores desde Supabase
	const investigadores = await obtenerInvestigadores();

	return {
		investigadores
	};
}
