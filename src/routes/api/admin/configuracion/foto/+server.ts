import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';
import { supabase } from '$lib/db/supabase.client';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST - Subir foto de perfil
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;

		// Obtener el FormData
		const formData = await request.formData();
		const file = formData.get('foto') as File;

		if (!file) {
			return jsonError('No se proporcionó ningún archivo', 400);
		}

		// Validar tipo de archivo
		if (!ALLOWED_TYPES.includes(file.type)) {
			return jsonError('Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF', 400);
		}

		// Validar tamaño
		if (file.size > MAX_FILE_SIZE) {
			return jsonError('El archivo es muy grande. Máximo 2MB', 400);
		}

		// Convertir File a ArrayBuffer para Supabase
		const arrayBuffer = await file.arrayBuffer();
		const buffer = new Uint8Array(arrayBuffer);

		// Generar nombre único para el archivo
		const fileExt = file.name.split('.').pop();
		const fileName = `${usuario.id}-${Date.now()}.${fileExt}`;
		const filePath = fileName;

		// Eliminar foto anterior si existe
		if (usuario.foto_perfil) {
			const oldFileName = usuario.foto_perfil.split('/').pop();
			if (oldFileName) {
				try {
					await supabase.storage.from('avatares').remove([oldFileName]);
				} catch (error) {
					console.warn('No se pudo eliminar la foto anterior:', error);
				}
			}
		}

		// Subir archivo a Supabase Storage
		const { error: uploadError } = await supabase.storage
			.from('avatares')
			.upload(filePath, buffer, {
				contentType: file.type,
				cacheControl: '3600',
				upsert: true
			});

		if (uploadError) {
			console.error('Error al subir archivo:', uploadError);
			if (uploadError.message.includes('Bucket not found')) {
				return jsonError(
					'El bucket de avatares no está configurado. Por favor ejecuta el script setup-avatares-storage.sql',
					500
				);
			}
			return jsonError(`Error al subir la foto: ${uploadError.message}`, 500);
		}

		// Obtener URL pública
		const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(filePath);

		const fotoUrl = urlData.publicUrl;

		// Actualizar URL en la base de datos
		const { error: updateError } = await supabase
			.from('usuarios')
			.update({
				foto_perfil: fotoUrl,
				actualizado_en: new Date().toISOString()
			})
			.eq('id', usuario.id);

		if (updateError) {
			console.error('Error al actualizar usuario:', updateError);
			// Intentar eliminar el archivo subido
			await supabase.storage.from('avatares').remove([filePath]);
			return jsonError('Error al actualizar la foto de perfil', 500);
		}

		return json({
			success: true,
			foto_perfil: fotoUrl,
			message: 'Foto de perfil actualizada correctamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error en POST /api/admin/configuracion/foto:', error);
		return jsonError('Error interno del servidor', 500);
	}
};

/**
 * DELETE - Eliminar foto de perfil
 */
export const DELETE: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);

		if (!usuario.foto_perfil) {
			return jsonError('No hay foto de perfil para eliminar', 400);
		}

		// Eliminar archivo de Storage
		const fileName = usuario.foto_perfil.split('/').pop();
		if (fileName) {
			const { error: deleteError } = await supabase.storage.from('avatares').remove([fileName]);

			if (deleteError) {
				console.error('Error al eliminar archivo:', deleteError);
			}
		}

		// Actualizar base de datos
		const { error: updateError } = await supabase
			.from('usuarios')
			.update({
				foto_perfil: null,
				actualizado_en: new Date().toISOString()
			})
			.eq('id', usuario.id);

		if (updateError) {
			console.error('Error al actualizar usuario:', updateError);
			return jsonError('Error al eliminar la foto de perfil', 500);
		}

		return json({
			success: true,
			message: 'Foto de perfil eliminada correctamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error en DELETE /api/admin/configuracion/foto:', error);
		return jsonError('Error interno del servidor', 500);
	}
};
