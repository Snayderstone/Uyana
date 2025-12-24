import { blogService } from '$lib/services/public/blog.service';

export async function load() {
	try {
		const posts = await blogService.getPublishedPosts();
		return { posts };
	} catch (error) {
		console.error('Error cargando posts:', error);
		return { posts: [] };
	}
}
