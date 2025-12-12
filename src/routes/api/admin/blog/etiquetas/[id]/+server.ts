/**
 * Admin API - Blog Etiqueta Individual Endpoints
 * -----------------------------------------------
 * DELETE /api/admin/blog/etiquetas/[id]     - Eliminar etiqueta
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { supabaseServer } from '$lib/db/supabase.server';

/**
 * DELETE - Eliminar una etiqueta
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id);

		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		// Primero eliminar las relaciones en la tabla junction
		const { error: junctionError } = await supabaseServer
			.from('blog_post_etiqueta')
			.delete()
			.eq('etiqueta_id', id);

		if (junctionError) {
			console.error('Error al eliminar relaciones de etiqueta:', junctionError);
			return json(
				{
					success: false,
					message: 'Error al eliminar relaciones de la etiqueta'
				},
				{ status: 500 }
			);
		}

		// Luego eliminar la etiqueta
		const { error: deleteError } = await supabaseServer
			.from('blog_etiquetas')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error('Error al eliminar etiqueta:', deleteError);
			return json(
				{
					success: false,
					message: 'Error al eliminar la etiqueta'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Etiqueta eliminada exitosamente'
		});
	} catch (error) {
		console.error('Error al eliminar etiqueta:', error);
		return json(
			{
				success: false,
				message: 'Error al eliminar la etiqueta'
			},
			{ status: 500 }
		);
	}
};
