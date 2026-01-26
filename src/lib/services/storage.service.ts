/**
 * Storage Service
 * ---------------
 * Servicio para manejar el almacenamiento de archivos en Supabase Storage.
 * Gestiona uploads, downloads, deletes y generación de URLs públicas.
 */

import { supabase } from '$lib/db/supabase.client';

const BUCKET_NAME = 'participant-photos';

/**
 * Sube una imagen al bucket de Supabase
 * @param file - Archivo a subir
 * @param participantId - ID del participante
 * @returns URL pública de la imagen subida
 */
export async function uploadParticipantPhoto(
	file: File,
	participantId: number
): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		// Validar archivo
		if (!file.type.startsWith('image/')) {
			return { success: false, error: 'El archivo debe ser una imagen' };
		}

		// Validar tamaño (máx 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return { success: false, error: 'La imagen debe ser menor a 5MB' };
		}

		// Generar nombre de archivo único
		const fileExt = file.name.split('.').pop();
		const fileName = `participant-${participantId}-${Date.now()}.${fileExt}`;
		const filePath = `${participantId}/${fileName}`;

		// Eliminar foto anterior si existe
		await deleteParticipantPhoto(participantId);

		// Subir archivo
		const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
			cacheControl: '3600',
			upsert: true
		});

		if (error) {
			console.error('Error uploading file:', error);
			return { success: false, error: error.message };
		}

		// Obtener URL pública
		const {
			data: { publicUrl }
		} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

		return { success: true, url: publicUrl };
	} catch (err) {
		console.error('Error in uploadParticipantPhoto:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Error desconocido al subir la imagen'
		};
	}
}

/**
 * Sube una imagen desde base64 al bucket de Supabase
 * @param base64Data - Datos en base64
 * @param participantId - ID del participante
 * @returns URL pública de la imagen subida
 */
export async function uploadParticipantPhotoFromBase64(
	base64Data: string,
	participantId: number
): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		// Extraer mime type y datos
		const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
		if (!matches || matches.length !== 3) {
			return { success: false, error: 'Formato base64 inválido' };
		}

		const mimeType = matches[1];
		const base64Content = matches[2];

		// Validar que sea una imagen
		if (!mimeType.startsWith('image/')) {
			return { success: false, error: 'El archivo debe ser una imagen' };
		}

		// Convertir base64 a blob
		const byteCharacters = atob(base64Content);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: mimeType });

		// Validar tamaño (máx 5MB)
		if (blob.size > 5 * 1024 * 1024) {
			return { success: false, error: 'La imagen debe ser menor a 5MB' };
		}

		// Generar nombre de archivo
		const fileExt = mimeType.split('/')[1];
		const fileName = `participant-${participantId}-${Date.now()}.${fileExt}`;
		const filePath = `${participantId}/${fileName}`;

		// Eliminar foto anterior si existe
		await deleteParticipantPhoto(participantId);

		// Subir archivo
		const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, blob, {
			contentType: mimeType,
			cacheControl: '3600',
			upsert: true
		});

		if (error) {
			console.error('Error uploading base64:', error);
			return { success: false, error: error.message };
		}

		// Obtener URL pública
		const {
			data: { publicUrl }
		} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

		return { success: true, url: publicUrl };
	} catch (err) {
		console.error('Error in uploadParticipantPhotoFromBase64:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Error desconocido al subir la imagen'
		};
	}
}

/**
 * Sube una imagen desde una URL externa al bucket de Supabase
 * @param imageUrl - URL de la imagen externa
 * @param participantId - ID del participante
 * @returns URL pública de la imagen subida
 */
export async function uploadParticipantPhotoFromUrl(
	imageUrl: string,
	participantId: number
): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		// Descargar imagen
		const response = await fetch(imageUrl);
		if (!response.ok) {
			return { success: false, error: 'No se pudo descargar la imagen de la URL' };
		}

		const blob = await response.blob();

		// Validar que sea una imagen
		if (!blob.type.startsWith('image/')) {
			return { success: false, error: 'La URL no apunta a una imagen válida' };
		}

		// Validar tamaño (máx 5MB)
		if (blob.size > 5 * 1024 * 1024) {
			return { success: false, error: 'La imagen debe ser menor a 5MB' };
		}

		// Generar nombre de archivo
		const fileExt = blob.type.split('/')[1];
		const fileName = `participant-${participantId}-${Date.now()}.${fileExt}`;
		const filePath = `${participantId}/${fileName}`;

		// Eliminar foto anterior si existe
		await deleteParticipantPhoto(participantId);

		// Subir archivo
		const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, blob, {
			contentType: blob.type,
			cacheControl: '3600',
			upsert: true
		});

		if (error) {
			console.error('Error uploading from URL:', error);
			return { success: false, error: error.message };
		}

		// Obtener URL pública
		const {
			data: { publicUrl }
		} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

		return { success: true, url: publicUrl };
	} catch (err) {
		console.error('Error in uploadParticipantPhotoFromUrl:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Error desconocido al descargar la imagen'
		};
	}
}

/**
 * Elimina la foto de un participante del bucket
 * @param participantId - ID del participante
 */
export async function deleteParticipantPhoto(participantId: number): Promise<void> {
	try {
		// Listar archivos del participante
		const { data: files } = await supabase.storage
			.from(BUCKET_NAME)
			.list(`${participantId}/`, {
				limit: 100
			});

		if (!files || files.length === 0) {
			return; // No hay archivos para eliminar
		}

		// Eliminar todos los archivos del participante
		const filePaths = files.map((file) => `${participantId}/${file.name}`);
		const { error } = await supabase.storage.from(BUCKET_NAME).remove(filePaths);

		if (error) {
			console.error('Error deleting files:', error);
		}
	} catch (err) {
		console.error('Error in deleteParticipantPhoto:', err);
	}
}

/**
 * Elimina la carpeta completa de un participante del bucket
 * (Incluye todos los archivos y la carpeta)
 * @param participantId - ID del participante
 * @returns True si se eliminó correctamente, false en caso de error
 */
export async function deleteParticipantFolder(
	participantId: number
): Promise<{ success: boolean; error?: string }> {
	try {
		// Listar todos los archivos del participante
		const { data: files, error: listError } = await supabase.storage
			.from(BUCKET_NAME)
			.list(`${participantId}/`, {
				limit: 1000 // Límite alto para asegurar que obtenemos todos los archivos
			});

		if (listError) {
			console.error('Error listing files:', listError);
			return { success: false, error: listError.message };
		}

		// Si no hay archivos, considerar exitoso
		if (!files || files.length === 0) {
			console.log(`No files found for participant ${participantId}`);
			return { success: true };
		}

		// Construir paths de todos los archivos
		const filePaths = files.map((file) => `${participantId}/${file.name}`);

		console.log(`Deleting ${filePaths.length} files for participant ${participantId}`);

		// Eliminar todos los archivos
		const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove(filePaths);

		if (deleteError) {
			console.error('Error deleting files:', deleteError);
			return { success: false, error: deleteError.message };
		}

		console.log(`Successfully deleted folder for participant ${participantId}`);
		return { success: true };
	} catch (err) {
		console.error('Error in deleteParticipantFolder:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Error desconocido al eliminar la carpeta'
		};
	}
}

/**
 * Obtiene la URL pública de la foto de un participante
 * @param filePath - Path del archivo en el bucket
 * @returns URL pública
 */
export function getParticipantPhotoUrl(filePath: string): string {
	const {
		data: { publicUrl }
	} = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
	return publicUrl;
}
