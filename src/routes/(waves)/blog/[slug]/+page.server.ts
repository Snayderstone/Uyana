import { blogService } from '$lib/services/public/blog.service';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { slug } = params;

	try {
		const post = await blogService.getPostDetail(slug);

		if (!post) {
			throw error(404, 'Post no encontrado');
		}

		return { post };
	} catch (err: any) {
		if (err.status === 404) {
			throw err;
		}
		console.error('Error cargando post:', err);
		throw error(500, 'Error al cargar el post');
	}
}
