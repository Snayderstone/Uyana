import { supabaseServer } from '$lib/db/supabase.server';
import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		const { data: etiquetas, error } = await supabaseServer
			.from('blog_etiquetas')
			.select('id, nombre, slug, color, uso_count')
			.order('uso_count', { ascending: false });

		if (error) throw error;

		return json({
			success: true,
			data: etiquetas || []
		});
	} catch (error) {
		console.error('Error loading tags:', error);
		return json(
			{
				success: false,
				error: 'Error al cargar etiquetas',
				message: error instanceof Error ? error.message : 'Error desconocido'
			},
			{ status: 500 }
		);
	}
}

export async function POST({ request }) {
	try {
		const { nombre, color } = await request.json();

		if (!nombre) {
			return json(
				{
					success: false,
					error: 'El nombre es obligatorio'
				},
				{ status: 400 }
			);
		}

		// Generar slug
		const slug = nombre
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-');

		const { data: etiqueta, error } = await supabaseServer
			.from('blog_etiquetas')
			.insert({
				nombre,
				slug,
				color: color || '#8b5cf6'
			})
			.select()
			.single();

		if (error) throw error;

		return json({
			success: true,
			data: etiqueta
		});
	} catch (error) {
		console.error('Error creating tag:', error);
		return json(
			{
				success: false,
				error: 'Error al crear etiqueta',
				message: error instanceof Error ? error.message : 'Error desconocido'
			},
			{ status: 500 }
		);
	}
}
