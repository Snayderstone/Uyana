import { supabase } from './supabase.client';
import type { Usuario, Sesion, Rol, UsuarioRol } from '$lib/models/auth.model';

/**
 * Repositorio para gestión de autenticación en Supabase
 */
export class AuthRepository {
	/**
	 * Buscar usuario por email
	 */
	async findUserByEmail(email: string): Promise<Usuario | null> {
		const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).single();

		if (error || !data) {
			return null;
		}

		return {
			id: data.id,
			email: data.email,
			nombre: data.nombre,
			contraseña_hash: data.contraseña_hash,
			foto_perfil: data.foto_perfil || null,
			creado_en: data.creado_en ? new Date(data.creado_en) : null,
			actualizado_en: data.actualizado_en ? new Date(data.actualizado_en) : null
		};
	}

	/**
	 * Buscar usuario por ID
	 */
	async findUserById(id: number): Promise<Usuario | null> {
		const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();

		if (error || !data) {
			return null;
		}

		return {
			id: data.id,
			email: data.email,
			nombre: data.nombre,
			contraseña_hash: data.contraseña_hash,
			foto_perfil: data.foto_perfil || null,
			creado_en: data.creado_en ? new Date(data.creado_en) : null,
			actualizado_en: data.actualizado_en ? new Date(data.actualizado_en) : null
		};
	}

	/**
	 * Crear un nuevo usuario
	 */
	async createUser(
		email: string,
		nombre: string,
		contraseña_hash: string
	): Promise<Usuario | null> {
		const { data, error } = await supabase
			.from('usuarios')
			.insert({
				email,
				nombre,
				contraseña_hash,
				creado_en: new Date().toISOString(),
				actualizado_en: new Date().toISOString()
			})
			.select()
			.single();

		if (error || !data) {
			console.error('Error al crear usuario:', error);
			return null;
		}

		return {
			id: data.id,
			email: data.email,
			nombre: data.nombre,
			contraseña_hash: data.contraseña_hash,
			foto_perfil: data.foto_perfil || null,
			creado_en: data.creado_en ? new Date(data.creado_en) : null,
			actualizado_en: data.actualizado_en ? new Date(data.actualizado_en) : null
		};
	}

	/**
	 * Actualizar contraseña de usuario
	 */
	async updateUserPassword(userId: number, contraseña_hash: string): Promise<boolean> {
		const { error } = await supabase
			.from('usuarios')
			.update({
				contraseña_hash,
				actualizado_en: new Date().toISOString()
			})
			.eq('id', userId);

		return !error;
	}

	/**
	 * Obtener roles de un usuario
	 */
	async getUserRoles(userId: number): Promise<string[]> {
		const { data, error } = await supabase
			.from('usuario_rol')
			.select(
				`
				rol_id,
				roles!fk_usuario_rol_rol (
					nombre
				)
			`
			)
			.eq('usuario_id', userId);

		if (error || !data) {
			console.error('Error al obtener roles:', error);
			return [];
		}

		return data.map((item: any) => item.roles?.nombre).filter(Boolean);
	}

	/**
	 * Asignar rol a usuario
	 */
	async assignRoleToUser(userId: number, rolId: number): Promise<boolean> {
		const { error } = await supabase.from('usuario_rol').insert({
			usuario_id: userId,
			rol_id: rolId,
			asignado_en: new Date().toISOString()
		});

		return !error;
	}

	/**
	 * Crear una nueva sesión
	 */
	async createSession(userId: number, token: string, expiresIn: Date): Promise<Sesion | null> {
		// Convertir a formato timestamp sin zona horaria (compatible con PostgreSQL timestamptz)
		const timestamp = expiresIn.toISOString().replace('T', ' ').replace('Z', '');

		const { data, error } = await supabase
			.from('sesiones')
			.insert({
				usuario_id: userId,
				token,
				expira_en: timestamp
			})
			.select()
			.single();

		if (error || !data) {
			console.error('Error al crear sesión:', error);
			return null;
		}

		return {
			id: data.id,
			usuario_id: data.usuario_id,
			token: data.token,
			expira_en: new Date(data.expira_en)
		};
	}

	/**
	 * Buscar sesión por token
	 */
	async findSessionByToken(token: string): Promise<Sesion | null> {
		const { data, error } = await supabase.from('sesiones').select('*').eq('token', token).single();

		if (error || !data) {
			return null;
		}

		return {
			id: data.id,
			usuario_id: data.usuario_id,
			token: data.token,
			expira_en: new Date(data.expira_en)
		};
	}

	/**
	 * Eliminar sesión (logout)
	 */
	async deleteSession(token: string): Promise<boolean> {
		const { error } = await supabase.from('sesiones').delete().eq('token', token);

		return !error;
	}

	/**
	 * Eliminar sesiones expiradas
	 */
	async deleteExpiredSessions(): Promise<boolean> {
		const { error } = await supabase
			.from('sesiones')
			.delete()
			.lt('expira_en', new Date().toISOString());

		return !error;
	}

	/**
	 * Eliminar todas las sesiones de un usuario
	 */
	async deleteUserSessions(userId: number): Promise<boolean> {
		const { error } = await supabase.from('sesiones').delete().eq('usuario_id', userId);

		return !error;
	}

	/**
	 * Obtener todos los roles disponibles
	 */
	async getAllRoles(): Promise<Rol[]> {
		const { data, error } = await supabase.from('roles').select('*');

		if (error || !data) {
			return [];
		}

		return data.map((rol) => ({
			id: rol.id,
			nombre: rol.nombre
		}));
	}

	/**
	 * Verificar si un usuario tiene un rol específico
	 */
	async userHasRole(userId: number, roleName: string): Promise<boolean> {
		const roles = await this.getUserRoles(userId);
		return roles.includes(roleName);
	}
}

// Exportar instancia única
export const authRepository = new AuthRepository();
