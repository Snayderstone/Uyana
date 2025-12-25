import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';
import { authService } from '$lib/services/auth.service';
import { supabase } from '$lib/db/supabase.client';
import bcrypt from 'bcryptjs';

/**
 * PUT - Actualizar contraseña del usuario
 */
export const PUT: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
		const { currentPassword, newPassword } = await request.json();

		// Validaciones
		if (!currentPassword || !newPassword) {
			return jsonError('Contraseña actual y nueva son requeridas', 400);
		}

		if (newPassword.length < 8) {
			return jsonError('La nueva contraseña debe tener al menos 8 caracteres', 400);
		}

		// Obtener usuario completo con contraseña hash
		const { data: userData, error: userError } = await supabase
			.from('usuarios')
			.select('*')
			.eq('id', usuario.id)
			.single();

		if (userError || !userData) {
			return jsonError('Usuario no encontrado', 404);
		}

		// Verificar contraseña actual
		const isPasswordValid = await bcrypt.compare(currentPassword, userData['contraseña_hash']);

		if (!isPasswordValid) {
			return jsonError('La contraseña actual es incorrecta', 401);
		}

		// Generar hash de la nueva contraseña
		const newPasswordHash = await bcrypt.hash(newPassword, 12);

		// Actualizar contraseña
		const { error } = await supabase
			.from('usuarios')
			.update({
				contraseña_hash: newPasswordHash,
				actualizado_en: new Date().toISOString()
			})
			.eq('id', usuario.id);

		if (error) {
			console.error('Error al actualizar contraseña:', error);
			return jsonError('Error al actualizar contraseña', 500);
		}

		// Revocar todas las sesiones activas del usuario (opcional)
		await supabase.from('sesiones').delete().eq('usuario_id', usuario.id);

		return json({
			success: true,
			message: 'Contraseña actualizada correctamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error en PUT /api/admin/configuracion/password:', error);
		return jsonError('Error interno del servidor', 500);
	}
};
