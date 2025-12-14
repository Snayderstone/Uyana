import features from '$lib/data/features';
import { blogService } from '$lib/services/public/blog.service';

export async function load() {
	try {
		// Cargar los últimos 4 posts publicados usando el servicio
		const allPosts = await blogService.getPublishedPosts();
		const posts = allPosts.slice(0, 4);

		return {
			features,
			posts
		};
	} catch (error) {
		console.error('Error cargando posts en homepage:', error);
		return {
			features,
			posts: []
		};
	}
}
