import { json, type RequestEvent } from '@sveltejs/kit';
import { authService } from '$lib/services/auth.service';
import { setAuthCookie, jsonError } from '$lib/utils/auth.utils';
import type { LoginCredentials } from '$lib/models/auth.model';

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
export async function POST(event: RequestEvent) {
	try {
		// Obtener credenciales del body
		const body = await event.request.json();
		const credentials: LoginCredentials = {
			email: body.email,
			password: body.password
		};

		// Validar campos
		if (!credentials.email || !credentials.password) {
			return jsonError('Email y contraseña son requeridos', 400);
		}

		// Intentar login
		const result = await authService.login(credentials);

		// Verificar si fue exitoso
		if (!result.success) {
			return jsonError((result as any).error || 'Error de autenticación', 401);
		}

		// Establecer cookie con el token
		setAuthCookie(event, result.token);

		// Retornar respuesta exitosa (sin el token en el body por seguridad)
		return json({
			success: true,
			usuario: result.usuario,
			roles: result.roles,
			mensaje: result.mensaje
		});
	} catch (error) {
		console.error('Error en POST /api/auth/login:', error);
		return jsonError('Error interno del servidor', 500);
	}
}
