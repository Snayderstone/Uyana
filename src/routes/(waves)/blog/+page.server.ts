import { supabaseServer } from '$lib/db/supabase.server';

export async function load() {
	const { data: posts, error } = await supabaseServer
		.from('blog_posts')
		.select('*')
		.eq('publicado', true)
		.order('fecha_publicacion', { ascending: false });

	if (error) {
		console.error('Error cargando posts:', error);
		return { posts: [] };
	}

	return {
		posts: posts.map((post) => ({
			id: post.id,
			titulo: post.titulo,
			slug: post.slug,
			resumen: post.resumen,
			imagen_portada: post.imagen_portada,
			fecha_publicacion: post.fecha_publicacion
		}))
	};
}
