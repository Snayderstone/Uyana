/**
 * Modelo de datos para consentimiento de usuario
 */
export interface ConsentRecord {
	id?: number;
	session_token: string;
	usuario_id?: number | null;
	ip_address: string | null;
	user_agent: string | null;
	terms_version: string;
	privacy_version: string;
	academic_use_version: string;
	terms_accepted: boolean;
	privacy_accepted: boolean;
	academic_use_accepted: boolean;
	accepted_at: Date;
	created_at?: Date;
}

export interface ConsentInput {
	sessionToken: string;
	usuarioId?: number | null;
	ipAddress: string | null;
	userAgent: string | null;
	termsVersion?: string;
	privacyVersion?: string;
	academicUseVersion?: string;
}
