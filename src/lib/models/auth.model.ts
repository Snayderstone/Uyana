/**
 * Modelos de autenticación y seguridad
 */

/**
 * Usuario del sistema
 */
export interface Usuario {
	id: number;
	email: string;
	nombre: string;
	contraseña_hash: string;
	foto_perfil?: string | null;
	creado_en: Date | null;
	actualizado_en: Date | null;
}

/**
 * Usuario sin contraseña (para respuestas públicas)
 */
export interface UsuarioSinPassword {
	id: number;
	email: string;
	nombre: string;
	foto_perfil?: string | null;
	creado_en: Date | null;
	actualizado_en: Date | null;
}

/**
 * Rol del sistema
 */
export interface Rol {
	id: number;
	nombre: string;
}

/**
 * Relación usuario-rol
 */
export interface UsuarioRol {
	id: number;
	usuario_id: number;
	rol_id: number;
	asignado_en: string | null;
}

/**
 * Sesión activa
 */
export interface Sesion {
	id: number;
	usuario_id: number;
	token: string;
	expira_en: Date;
	creado_en?: Date;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
	email: string;
	password: string;
}

/**
 * Respuesta de login exitoso
 */
export interface LoginResponse {
	success: boolean;
	token: string;
	usuario: UsuarioSinPassword;
	roles: string[];
	mensaje?: string;
}

/**
 * Respuesta de error de autenticación
 */
export interface AuthError {
	success: false;
	error: string;
	codigo?: string;
}

/**
 * Payload del JWT
 */
export interface JWTPayload {
	userId: number;
	email: string;
	nombre: string;
	roles: string[];
	iat: number;
	exp: number;
}

/**
 * Usuario autenticado (desde token)
 */
export interface UsuarioAutenticado {
	id: number;
	email: string;
	nombre: string;
	foto_perfil?: string | null;
	roles: string[];
}

/**
 * Opciones de configuración de autenticación
 */
export interface AuthConfig {
	jwtSecret: string;
	jwtExpiresIn: string; // e.g., '7d', '24h'
	cookieName: string;
	cookieMaxAge: number; // en segundos
	bcryptRounds: number;
}
