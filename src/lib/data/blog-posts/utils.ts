import type { BlogPost } from '$lib/utils/types';

/**
 * Importa los posts del blog desde Supabase
 * @param includeHidden - Si debe incluir posts ocultos
 * @returns Array de posts
 */
export function importPosts(includeHidden: boolean = false): BlogPost[] {
	// TODO: Implementar importación desde Supabase
	// Por ahora retorna array vacío para evitar errors en RSS
	return [];
}

/**
 * Filtra posts según criterios (visible, por fecha, etc.)
 * @param posts - Posts a filtrar
 * @returns Posts filtrados
 */
export function filterPosts(posts: BlogPost[]): BlogPost[] {
	// Filtra por posts no ocultos y los ordena por fecha descendente
	return posts
		.filter((post) => !post.hidden)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
