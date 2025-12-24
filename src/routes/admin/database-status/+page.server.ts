import { supabase } from '$lib/db/supabase.client';

export const load = async () => {
	const startTime = Date.now();

	try {
		// Test de conexión básico
		const pingStart = Date.now();
		const { error: pingError } = await supabase.from('proyectos').select('id').limit(1);
		const pingLatency = Date.now() - pingStart;

		if (pingError) {
			return {
				connected: false,
				error: pingError.message,
				timestamp: new Date().toISOString(),
				metrics: null
			};
		}

		// Obtener métricas de las tablas principales
		const [
			proyectosCount,
			participantesCount,
			institucionesCount,
			facultadesCount,
			areasCount,
			lineasCount,
			blogCount
		] = await Promise.all([
			supabase.from('proyectos').select('id', { count: 'exact', head: true }),
			supabase.from('participantes').select('id', { count: 'exact', head: true }),
			supabase.from('instituciones').select('id', { count: 'exact', head: true }),
			supabase.from('facultades').select('id', { count: 'exact', head: true }),
			supabase.from('areas_conocimiento').select('id', { count: 'exact', head: true }),
			supabase.from('lineas_investigacion').select('id', { count: 'exact', head: true }),
			supabase.from('blog_posts').select('id', { count: 'exact', head: true })
		]);

		// Últimas actualizaciones
		const { data: lastProjects } = await supabase
			.from('proyectos')
			.select('actualizado_en')
			.order('actualizado_en', { ascending: false })
			.limit(1);

		const { data: lastBlogPost } = await supabase
			.from('blog_posts')
			.select('actualizado_en')
			.order('actualizado_en', { ascending: false })
			.limit(1);

		const totalTime = Date.now() - startTime;

		return {
			connected: true,
			timestamp: new Date().toISOString(),
			metrics: {
				tables: {
					proyectos: proyectosCount.count || 0,
					participantes: participantesCount.count || 0,
					instituciones: institucionesCount.count || 0,
					facultades: facultadesCount.count || 0,
					areas_conocimiento: areasCount.count || 0,
					lineas_investigacion: lineasCount.count || 0,
					blog_posts: blogCount.count || 0
				},
				performance: {
					pingLatency,
					totalQueryTime: totalTime,
					avgQueryTime: Math.round(totalTime / 8)
				},
				lastUpdates: {
					projects: lastProjects?.[0]?.actualizado_en || null,
					blog: lastBlogPost?.[0]?.actualizado_en || null
				}
			},
			environment: {
				supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL || 'Not configured',
				hasAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY
			}
		};
	} catch (error: any) {
		return {
			connected: false,
			error: error.message || 'Error desconocido',
			timestamp: new Date().toISOString(),
			metrics: null
		};
	}
};
