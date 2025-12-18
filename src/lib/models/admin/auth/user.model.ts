/**
 * Admin Module - User Models
 * ---------------------------
 * Entidades relacionadas con usuarios, roles y autenticación.
 */

export interface Rol {
	id: number;
	nombre: string;
}

export interface Usuario {
	id: number;
	email: string;
	nombre: string;
	contraseña_hash: string;
	creado_en?: Date;
	actualizado_en?: Date;
}

export interface UsuarioRol {
	id: number;
	usuario_id: number;
	rol_id: number;
	asignado_en?: Date;
}

export interface Sesion {
	id: number;
	usuario_id: number;
	token: string;
	expira_en?: Date;
}
