/**
 * Test de Diagnóstico de Supabase Storage
 * ----------------------------------------
 * Este endpoint verifica la configuración de Supabase Storage
 *
 * GET /api/admin/blog/test-storage
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';
import { supabase } from '$lib/db/supabase.client';

export const GET: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);

		const diagnostics = {
			authenticated: true,
			user: usuario.email,
			tests: [] as any[]
		};

		// Test 1: Verificar variables de entorno
		const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
		const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

		diagnostics.tests.push({
			test: 'Variables de entorno',
			status: supabaseUrl && supabaseKey ? 'OK' : 'FAIL',
			details: {
				hasUrl: !!supabaseUrl,
				hasKey: !!supabaseKey,
				url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NO CONFIGURADA'
			}
		});

		// Test 2: Listar buckets
		try {
			const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

			if (bucketsError) {
				diagnostics.tests.push({
					test: 'Listar buckets',
					status: 'ERROR',
					error: bucketsError.message
				});
			} else {
				const blogImagesBucket = buckets?.find((b) => b.name === 'blog-images');

				diagnostics.tests.push({
					test: 'Listar buckets',
					status: 'OK',
					details: {
						totalBuckets: buckets?.length || 0,
						buckets: buckets?.map((b) => b.name) || [],
						blogImagesBucketExists: !!blogImagesBucket,
						blogImagesBucketPublic: blogImagesBucket?.public || false
					}
				});
			}
		} catch (error: any) {
			diagnostics.tests.push({
				test: 'Listar buckets',
				status: 'EXCEPTION',
				error: error.message
			});
		}

		// Test 3: Verificar acceso al bucket blog-images
		try {
			const { data: files, error: filesError } = await supabase.storage
				.from('blog-images')
				.list('', { limit: 5 });

			if (filesError) {
				diagnostics.tests.push({
					test: 'Acceso al bucket blog-images',
					status: 'ERROR',
					error: filesError.message,
					suggestion: filesError.message.includes('not found')
						? 'El bucket "blog-images" no existe. Créalo en Supabase Dashboard > Storage'
						: 'Verifica los permisos del bucket'
				});
			} else {
				diagnostics.tests.push({
					test: 'Acceso al bucket blog-images',
					status: 'OK',
					details: {
						filesCount: files?.length || 0,
						files: files?.slice(0, 5).map((f) => f.name) || []
					}
				});
			}
		} catch (error: any) {
			diagnostics.tests.push({
				test: 'Acceso al bucket blog-images',
				status: 'EXCEPTION',
				error: error.message
			});
		}

		// Resumen
		const allOk = diagnostics.tests.every((t) => t.status === 'OK');
		diagnostics['summary'] = allOk
			? '✅ Todo está configurado correctamente'
			: '⚠️ Hay problemas de configuración. Revisa los detalles.';

		console.log(`[AUDIT] ${usuario.email} ejecutó test de diagnóstico de storage`);

		return json({
			success: true,
			data: diagnostics
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error en diagnóstico:', error);
		return json(
			{
				success: false,
				message: 'Error al ejecutar diagnóstico',
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
