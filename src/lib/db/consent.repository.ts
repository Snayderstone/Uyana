import { supabase } from './supabase.client';
import type { ConsentRecord, ConsentInput } from '$lib/models/consent.model';

/**
 * Repositorio para gestión de consentimientos de usuario
 */
export class ConsentRepository {
	/**
	 * Guardar registro de consentimiento
	 */
	async saveConsent(input: ConsentInput): Promise<{ success: boolean; error?: string }> {
		try {
			// Truncar valores largos para evitar errores de base de datos
			const sessionToken = input.sessionToken.substring(0, 255);
			const ipAddress = input.ipAddress?.substring(0, 45) || null;
			const userAgent = input.userAgent?.substring(0, 500) || null; // Truncar user_agent
			
			const record: Omit<ConsentRecord, 'id' | 'created_at'> = {
				session_token: sessionToken,
				usuario_id: input.usuarioId || null,
				ip_address: ipAddress,
				user_agent: userAgent,
				terms_version: input.termsVersion || '1.0',
				privacy_version: input.privacyVersion || '1.0',
				academic_use_version: input.academicUseVersion || '1.0',
				terms_accepted: true,
				privacy_accepted: true,
				academic_use_accepted: true,
				accepted_at: new Date()
			};

			const { error } = await supabase.from('user_consents').insert(record);

			if (error) {
				console.error('Error guardando consentimiento:', error);
				return { success: false, error: error.message };
			}

			return { success: true };
		} catch (e) {
			console.error('Error inesperado guardando consentimiento:', e);
			return { success: false, error: 'Error inesperado al guardar el consentimiento' };
		}
	}

	/**
	 * Verificar si una sesión tiene consentimiento registrado
	 */
	async hasConsent(sessionToken: string): Promise<boolean> {
		try {
			const { data, error } = await supabase
				.from('user_consents')
				.select('id')
				.eq('session_token', sessionToken)
				.single();

			if (error) {
				return false;
			}

			return !!data;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Obtener todos los consentimientos de un usuario
	 */
	async getUserConsents(usuarioId: number): Promise<ConsentRecord[]> {
		try {
			const { data, error } = await supabase
				.from('user_consents')
				.select('*')
				.eq('usuario_id', usuarioId)
				.order('accepted_at', { ascending: false });

			if (error || !data) {
				return [];
			}

			return data.map((record) => ({
				...record,
				accepted_at: new Date(record.accepted_at),
				created_at: record.created_at ? new Date(record.created_at) : undefined
			}));
		} catch (e) {
			console.error('Error obteniendo consentimientos:', e);
			return [];
		}
	}
}

export const consentRepository = new ConsentRepository();
