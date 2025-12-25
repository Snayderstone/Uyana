import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';
import { supabase } from '$lib/db/supabase.client';

/**
 * PUT - Actualizar perfil del usuario
 */
export const PUT: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
		const { nombre, email } = await request.json();

		// Validaciones
		if (!nombre?.trim()) {
			return jsonError('El nombre es requerido', 400);
		}

		if (!email?.trim() || !email.includes('@')) {
			return jsonError('Email inválido', 400);
		}

		// Verificar si el email ya existe (para otro usuario)
		if (email !== usuario.email) {
			const { data: existingUser } = await supabase
				.from('usuarios')
				.select('id')
				.eq('email', email)
				.neq('id', usuario.id)
				.single();

			if (existingUser) {
				return jsonError('El email ya está en uso', 400);
			}
		}

		// Actualizar usuario
		const { error } = await supabase
			.from('usuarios')
			.update({
				nombre: nombre.trim(),
				email: email.trim(),
				actualizado_en: new Date().toISOString()
			})
			.eq('id', usuario.id);

		if (error) {
			console.error('Error al actualizar perfil:', error);
			return jsonError('Error al actualizar perfil', 500);
		}

		return json({
			success: true,
			message: 'Perfil actualizado correctamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error en PUT /api/admin/configuracion/perfil:', error);
		return jsonError('Error interno del servidor', 500);
	}
};
