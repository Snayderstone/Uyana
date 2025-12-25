import * as bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { dev } from '$app/environment';
import type {
	LoginCredentials,
	LoginResponse,
	AuthError,
	UsuarioSinPassword,
	JWTPayload,
	UsuarioAutenticado
} from '$lib/models/auth.model';
import { authRepository } from '$lib/db/auth.repository';

/**
 * Configuración de autenticación
 */
const AUTH_CONFIG = {
	jwtSecret: process.env.JWT_SECRET || 'uyana-secret-key-change-in-production',
	jwtExpiresIn: '7d', // 7 días
	cookieName: 'auth_token',
	cookieMaxAge: 7 * 24 * 60 * 60, // 7 días en segundos
	bcryptRounds: 12
};

/**
 * Servicio de autenticación
 */
export class AuthService {
	/**
	 * Iniciar sesión
	 */
	async login(credentials: LoginCredentials): Promise<LoginResponse | AuthError> {
		try {
			// Buscar usuario por email
			const usuario = await authRepository.findUserByEmail(credentials.email);

			if (!usuario) {
				return {
					success: false,
					error: 'Credenciales inválidas'
				};
			}

			// Verificar contraseña
			const passwordMatch = await bcrypt.compare(credentials.password, usuario.contraseña_hash);

			if (!passwordMatch) {
				return {
					success: false,
					error: 'Credenciales inválidas'
				};
			}

			// Obtener roles del usuario
			const roles = await authRepository.getUserRoles(usuario.id);

			// Generar JWT
			const token = this.generateJWT({
				userId: usuario.id,
				email: usuario.email,
				nombre: usuario.nombre,
				roles
			});

			// Calcular fecha de expiración
			const expiresIn = new Date();
			expiresIn.setDate(expiresIn.getDate() + 7); // 7 días

			// Guardar sesión en la base de datos
			await authRepository.createSession(usuario.id, token, expiresIn);

			// Retornar respuesta exitosa
			const usuarioSinPassword: UsuarioSinPassword = {
				id: usuario.id,
				email: usuario.email,
				nombre: usuario.nombre,
				creado_en: usuario.creado_en,
				actualizado_en: usuario.actualizado_en
			};

			return {
				success: true,
				token,
				usuario: usuarioSinPassword,
				roles,
				mensaje: 'Inicio de sesión exitoso'
			};
		} catch (error) {
			console.error('Error en login:', error);
			return {
				success: false,
				error: 'Error interno del servidor'
			};
		}
	}

	/**
	 * Cerrar sesión
	 */
	async logout(token: string): Promise<boolean> {
		try {
			// Eliminar sesión de la base de datos
			return await authRepository.deleteSession(token);
		} catch (error) {
			console.error('Error en logout:', error);
			return false;
		}
	}

	/**
	 * Verificar token JWT
	 */
	async verifyToken(token: string): Promise<UsuarioAutenticado | null> {
		try {
			// Verificar que el token exista en la base de datos
			const sesion = await authRepository.findSessionByToken(token);

			if (!sesion) {
				return null;
			}

			// Verificar que la sesión no haya expirado
			if (new Date() > sesion.expira_en) {
				// Eliminar sesión expirada
				await authRepository.deleteSession(token);
				return null;
			}

			// Verificar y decodificar JWT
			const decoded = jwt.verify(token, AUTH_CONFIG.jwtSecret) as JWTPayload;

			// Obtener usuario actualizado de la base de datos
			const usuario = await authRepository.findUserById(decoded.userId);

			if (!usuario) {
				return null;
			}

			// Obtener roles actualizados
			const roles = await authRepository.getUserRoles(usuario.id);

			return {
				id: usuario.id,
				email: usuario.email,
				nombre: usuario.nombre,
				roles
			};
		} catch (error) {
			console.error('Error al verificar token:', error);
			return null;
		}
	}

	/**
	 * Generar JWT
	 */
	private generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
		const options: SignOptions = {
			expiresIn: AUTH_CONFIG.jwtExpiresIn as any
		};
		return jwt.sign(payload, AUTH_CONFIG.jwtSecret, options);
	}

	/**
	 * Hash de contraseña
	 */
	async hashPassword(password: string): Promise<string> {
		return await bcrypt.hash(password, AUTH_CONFIG.bcryptRounds);
	}

	/**
	 * Crear usuario administrador (usar solo para setup inicial)
	 */
	async createAdmin(email: string, nombre: string, password: string): Promise<boolean> {
		try {
			// Verificar si ya existe un usuario con ese email
			const existingUser = await authRepository.findUserByEmail(email);

			if (existingUser) {
				console.error('Ya existe un usuario con ese email');
				return false;
			}

			// Hash de contraseña
			const contraseña_hash = await this.hashPassword(password);

			// Crear usuario
			const usuario = await authRepository.createUser(email, nombre, contraseña_hash);

			if (!usuario) {
				return false;
			}

			// Obtener o crear rol de administrador
			const roles = await authRepository.getAllRoles();
			let adminRole = roles.find((r) => r.nombre === 'Administrador');

			// Si no existe el rol, crearlo manualmente en la base de datos
			if (!adminRole) {
				console.warn('No se encontró el rol Administrador. Debe crearlo en la base de datos.');
				return false;
			}

			// Asignar rol de administrador
			await authRepository.assignRoleToUser(usuario.id, adminRole.id);

			return true;
		} catch (error) {
			console.error('Error al crear admin:', error);
			return false;
		}
	}

	/**
	 * Cambiar contraseña
	 */
	async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
		try {
			// Obtener usuario
			const usuario = await authRepository.findUserById(userId);

			if (!usuario) {
				return false;
			}

			// Verificar contraseña antigua
			const passwordMatch = await bcrypt.compare(oldPassword, usuario.contraseña_hash);

			if (!passwordMatch) {
				return false;
			}

			// Hash de nueva contraseña
			const contraseña_hash = await this.hashPassword(newPassword);

			// Actualizar contraseña
			return await authRepository.updateUserPassword(userId, contraseña_hash);
		} catch (error) {
			console.error('Error al cambiar contraseña:', error);
			return false;
		}
	}

	/**
	 * Verificar si el usuario tiene un rol específico
	 */
	async userHasRole(userId: number, roleName: string): Promise<boolean> {
		return await authRepository.userHasRole(userId, roleName);
	}

	/**
	 * Limpiar sesiones expiradas
	 */
	async cleanupExpiredSessions(): Promise<void> {
		await authRepository.deleteExpiredSessions();
	}

	/**
	 * Obtener configuración de autenticación
	 */
	getAuthConfig() {
		return {
			cookieName: AUTH_CONFIG.cookieName,
			cookieMaxAge: AUTH_CONFIG.cookieMaxAge,
			isDevelopment: dev
		};
	}
}

// Exportar instancia única
export const authService = new AuthService();
