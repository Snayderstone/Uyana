/**
 * Endpoint de prueba para debugging del monto_presupuesto_total
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/db/supabase.client';

export const GET: RequestHandler = async () => {
	try {
		// Obtener un proyecto directamente de Supabase
		const { data: proyectos, error } = await supabase
			.from('proyectos')
			.select('id, codigo, titulo, monto_presupuesto_total, porcentaje_avance')
			.limit(5);

		if (error) {
			return json({ error: error.message }, { status: 500 });
		}

		// Análisis detallado de cada proyecto
		const analisis = proyectos?.map((p) => ({
			id: p.id,
			codigo: p.codigo,
			titulo: p.titulo,
			monto_original: p.monto_presupuesto_total,
			monto_tipo: typeof p.monto_presupuesto_total,
			monto_parseFloat: parseFloat(p.monto_presupuesto_total),
			monto_Number: Number(p.monto_presupuesto_total),
			monto_toString: String(p.monto_presupuesto_total),
			porcentaje_original: p.porcentaje_avance,
			porcentaje_tipo: typeof p.porcentaje_avance
		}));

		// Calcular suma total
		const sumaDirecta = proyectos?.reduce((sum, p) => sum + p.monto_presupuesto_total, 0);
		const sumaParseFloat = proyectos?.reduce(
			(sum, p) => sum + parseFloat(p.monto_presupuesto_total),
			0
		);
		const sumaNumber = proyectos?.reduce((sum, p) => sum + Number(p.monto_presupuesto_total), 0);

		return json({
			proyectos_count: proyectos?.length || 0,
			analisis_detallado: analisis,
			sumas: {
				suma_directa: sumaDirecta,
				suma_directa_tipo: typeof sumaDirecta,
				suma_parseFloat: sumaParseFloat,
				suma_Number: sumaNumber
			},
			nota: 'Este endpoint es solo para debugging. Eliminar después de resolver el problema.'
		});
	} catch (error) {
		console.error('Error en test endpoint:', error);
		return json({ error: String(error) }, { status: 500 });
	}
};
