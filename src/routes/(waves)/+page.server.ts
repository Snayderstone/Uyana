import features from '$lib/data/features';
import { supabaseServer } from '$lib/db/supabase.server';

export async function load() {
	// Cargar los últimos 4 posts publicados
	const { data: posts } = await supabaseServer
		.from('blog_posts')
		.select('id, titulo, slug, resumen, imagen_portada, fecha_publicacion')
		.eq('publicado', true)
		.order('fecha_publicacion', { ascending: false })
		.limit(4);

	const formattedPosts = (posts || []).map((post) => ({
		titulo: post.titulo,
		slug: post.slug,
		resumen: post.resumen || '',
		imagen_portada: post.imagen_portada || '/images/posts/placeholder.jpg',
		fecha_publicacion: post.fecha_publicacion
	}));

	return {
		features,
		posts: formattedPosts
	};
}
