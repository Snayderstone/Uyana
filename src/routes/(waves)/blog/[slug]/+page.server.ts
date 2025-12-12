import { supabaseServer } from '$lib/db/supabase.server';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { slug } = params;

	// Cargar el post por slug
	const { data: post, error: postError } = await supabaseServer
		.from('blog_posts')
		.select('*')
		.eq('slug', slug)
		.eq('publicado', true)
		.single();

	if (postError || !post) {
		throw error(404, 'Post no encontrado');
	}

	// Cargar las categorías del post
	const { data: categorias } = await supabaseServer
		.from('blog_post_categoria')
		.select('categoria:blog_categorias(nombre, slug)')
		.eq('post_id', post.id);

	const tags = (categorias || []).map((c: any) => c.categoria?.nombre).filter(Boolean);

	return {
		post: {
			titulo: post.titulo,
			slug: post.slug,
			contenido: post.contenido,
			resumen: post.resumen || '',
			imagen_portada: post.imagen_portada || '/images/posts/placeholder.jpg',
			fecha_publicacion: post.fecha_publicacion || post.creado_en,
			tags,
			autor: {
				nombre: 'Dirección de Investigación UCE',
				avatar: null
			}
		}
	};
}
