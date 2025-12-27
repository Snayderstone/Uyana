/**
 * Setup Automático de Supabase Storage
 * -------------------------------------
 * Crea el bucket blog-images y configura políticas de acceso
 *
 * POST /api/admin/blog/setup-storage
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';
import { supabase } from '$lib/db/supabase.client';

export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const results = {
			steps: [] as any[],
			success: false
		};

		// Paso 1: Crear bucket blog-images
		console.log('📦 Creando bucket blog-images...');
		const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(
			'blog-images',
			{
				public: true,
				fileSizeLimit: 5242880, // 5MB
				allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
			}
		);

		if (bucketError) {
			// Si el error es que ya existe, está bien
			if (bucketError.message.includes('already exists')) {
				results.steps.push({
					step: 'Crear bucket',
					status: 'SKIP',
					message: 'El bucket ya existe'
				});
			} else {
				results.steps.push({
					step: 'Crear bucket',
					status: 'ERROR',
					error: bucketError.message
				});
				console.error('❌ Error al crear bucket:', bucketError);
			}
		} else {
			results.steps.push({
				step: 'Crear bucket',
				status: 'OK',
				message: 'Bucket creado exitosamente'
			});
			console.log('✅ Bucket creado');
		}

		// Paso 2: Verificar que el bucket sea público
		const { data: buckets } = await supabase.storage.listBuckets();
		const blogBucket = buckets?.find((b) => b.name === 'blog-images');

		if (blogBucket) {
			results.steps.push({
				step: 'Verificar bucket público',
				status: blogBucket.public ? 'OK' : 'WARNING',
				message: blogBucket.public
					? 'El bucket es público'
					: 'El bucket no es público. Cámbialo manualmente en Supabase Dashboard'
			});
		}

		// Paso 3: Instrucciones para políticas RLS
		results.steps.push({
			step: 'Configurar políticas RLS',
			status: 'MANUAL',
			message: 'Debes configurar las políticas en Supabase Dashboard',
			instructions: [
				'1. Ve a Supabase Dashboard > Storage > Policies',
				'2. Crea una política para INSERT:',
				'   - Nombre: "Allow authenticated uploads"',
				'   - Operación: INSERT',
				'   - Policy definition: true',
				'3. Crea una política para SELECT:',
				'   - Nombre: "Public read access"',
				'   - Operación: SELECT',
				'   - Policy definition: true'
			]
		});

		// Paso 4: Test de subida
		console.log('🧪 Testeando subida...');
		const testFileName = `test-${Date.now()}.txt`;
		const testFile = new Blob(['test'], { type: 'text/plain' });

		const { error: uploadError } = await supabase.storage
			.from('blog-images')
			.upload(testFileName, testFile);

		if (uploadError) {
			results.steps.push({
				step: 'Test de subida',
				status: 'ERROR',
				error: uploadError.message,
				suggestion: uploadError.message.includes('row-level security')
					? 'Necesitas configurar las políticas RLS manualmente (ver instrucciones arriba)'
					: 'Verifica los permisos del bucket'
			});
		} else {
			// Limpiar archivo de prueba
			await supabase.storage.from('blog-images').remove([testFileName]);

			results.steps.push({
				step: 'Test de subida',
				status: 'OK',
				message: '¡Subida exitosa! Todo está configurado correctamente'
			});
		}

		// Determinar éxito general
		const hasErrors = results.steps.some((s) => s.status === 'ERROR');
		const hasManual = results.steps.some((s) => s.status === 'MANUAL');

		results.success = !hasErrors;
		results['summary'] = hasErrors
			? '❌ Hay errores que requieren atención'
			: hasManual
			? '⚠️ Setup parcial. Completa los pasos manuales.'
			: '✅ ¡Todo configurado correctamente!';

		console.log(`[AUDIT] ${usuario.email} ejecutó setup de storage`);

		return json({
			success: true,
			data: results
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error en setup:', error);
		return json(
			{
				success: false,
				message: 'Error al ejecutar setup',
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
