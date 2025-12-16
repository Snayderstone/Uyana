/**
 * Matcher para parámetros que deben ser enteros
 * Esto asegura que rutas como /admin/proyectos/[id] solo capturen números
 */
export function match(param: string): boolean {
	return /^\d+$/.test(param);
}
