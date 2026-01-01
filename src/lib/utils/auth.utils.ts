import { type RequestEvent } from '@sveltejs/kit';
import { authService } from '$lib/services/auth.service';
import type { UsuarioAutenticado } from '$lib/models/auth.model';

/**
 * Configuración de cookies
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  // `secure` and `sameSite` will be adjusted at set time depending on environment
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 días
};

/**
 * Obtener token de las cookies
 */
export function getAuthToken(event: RequestEvent): string | null {
	const config = authService.getAuthConfig();
	return event.cookies.get(config.cookieName) || null;
}

/**
 * Establecer cookie de autenticación
 */
export function setAuthCookie(event: RequestEvent, token: string): void {
	const config = authService.getAuthConfig();

	// Para entornos de producción donde el frontend puede estar en un dominio distinto
	// necesitamos `SameSite=None` y `secure=true` para que el navegador acepte cookies cross-site.
	const runtimeOptions: any = {
		...COOKIE_OPTIONS,
		secure: !config.isDevelopment,
		sameSite: config.isDevelopment ? 'lax' : 'none'
	};

	event.cookies.set(config.cookieName, token, runtimeOptions);
}

/**
 * Eliminar cookie de autenticación
 */
export function removeAuthCookie(event: RequestEvent): void {
	const config = authService.getAuthConfig();

	// Borrar cookie usando path y (si aplica) sameSite/secure opciones
	event.cookies.delete(config.cookieName, {
		path: '/'
	});
}

/**
 * Verificar autenticación desde el evento de request
 */
export async function verifyAuth(event: RequestEvent): Promise<UsuarioAutenticado | null> {
	const token = getAuthToken(event);

	if (!token) {
		return null;
	}

	return await authService.verifyToken(token);
}

/**
 * Middleware: Requiere autenticación
 * Retorna el usuario autenticado o lanza error 401
 */
export async function requireAuth(event: RequestEvent): Promise<UsuarioAutenticado> {
	const usuario = await verifyAuth(event);

	if (!usuario) {
		throw new Error('No autenticado');
	}

	return usuario;
}

/**
 * Middleware: Requiere rol específico
 */
export async function requireRole(event: RequestEvent, role: string): Promise<UsuarioAutenticado> {
	const usuario = await requireAuth(event);

	if (!usuario.roles.includes(role)) {
		throw new Error('Permisos insuficientes');
	}

	return usuario;
}

/**
 * Middleware: Requiere ser administrador
 */
export async function requireAdmin(event: RequestEvent): Promise<UsuarioAutenticado> {
	return await requireRole(event, 'Administrador');
}

/**
 * Verificar si el usuario tiene un rol específico
 */
export function hasRole(usuario: UsuarioAutenticado | null, role: string): boolean {
	return usuario?.roles.includes(role) ?? false;
}

/**
 * Verificar si el usuario es administrador
 */
export function isAdmin(usuario: UsuarioAutenticado | null): boolean {
	return hasRole(usuario, 'Administrador');
}

/**
 * Crear respuesta JSON de éxito
 */
export function jsonSuccess<T>(data: T, status = 200) {
	return new Response(JSON.stringify({ success: true, data }), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

/**
 * Crear respuesta JSON de error
 */
export function jsonError(message: string, status = 400) {
	return new Response(JSON.stringify({ success: false, error: message }), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

/**
 * Crear respuesta de no autorizado
 */
export function unauthorizedError(message = 'No autorizado') {
	return jsonError(message, 401);
}

/**
 * Crear respuesta de prohibido
 */
export function forbiddenError(message = 'Acceso prohibido') {
	return jsonError(message, 403);
}
