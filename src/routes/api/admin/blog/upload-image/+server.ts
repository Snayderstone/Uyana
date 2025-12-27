/**
 * Admin API - Upload Blog Image
 * ------------------------------
 * POST   /api/admin/blog/upload-image   - Subir imagen de blog a Supabase Storage
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';
import { supabase } from '$lib/db/supabase.client';
import path from 'path';

/**
 * POST - Subir una imagen para un post de blog a Supabase Storage
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;

		const formData = await request.formData();
		const file = formData.get('image') as File;

		if (!file) {
			return json(
				{
					success: false,
					message: 'No se proporcionó ninguna imagen'
				},
				{ status: 400 }
			);
		}

		// Validar tipo de archivo
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
		if (!allowedTypes.includes(file.type)) {
			return json(
				{
					success: false,
					message: 'Tipo de archivo no permitido. Solo se aceptan imágenes (jpg, png, webp, avif)'
				},
				{ status: 400 }
			);
		}

		// Validar tamaño (máximo 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return json(
				{
					success: false,
					message: 'La imagen es demasiado grande. Tamaño máximo: 5MB'
				},
				{ status: 400 }
			);
		}

		// Generar nombre único para evitar colisiones
		const timestamp = Date.now();
		const fileExtension = path.extname(file.name);
		const fileNameWithoutExt = path.basename(file.name, fileExtension);
		const sanitizedFileName = fileNameWithoutExt
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
		const uniqueFileName = `${sanitizedFileName}-${timestamp}${fileExtension}`;

		// Convertir File a ArrayBuffer para Supabase
		const arrayBuffer = await file.arrayBuffer();

		// Subir a Supabase Storage
		const { data, error } = await supabase.storage
			.from('blog-images')
			.upload(uniqueFileName, arrayBuffer, {
				contentType: file.type,
				upsert: false
			});

		if (error) {
			console.error('Error al subir a Supabase:', error);
			throw new Error(`Error al subir imagen: ${error.message}`);
		}

		// Obtener URL pública
		const { data: publicUrlData } = supabase.storage
			.from('blog-images')
			.getPublicUrl(uniqueFileName);

		const imageUrl = publicUrlData.publicUrl;

		console.log(`[AUDIT] ${usuario.email} subió imagen a Supabase: ${uniqueFileName}`);

		return json({
			success: true,
			data: {
				url: imageUrl,
				filename: uniqueFileName,
				size: file.size,
				type: file.type
			},
			message: 'Imagen subida exitosamente a Supabase Storage'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al subir imagen:', error);
		return json(
			{
				success: false,
				message: 'Error al subir la imagen',
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
