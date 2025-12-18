/**
 * Admin Module - Participant DTOs
 * --------------------------------
 * DTOs para participantes/investigadores.
 */

export interface CreateParticipanteDTO {
	carrera_id: number;
	email: string;
	nombre: string;
	genero: string;
	url_foto?: string;
	acreditado?: boolean;
	redes_sociales?: string;
}

export interface UpdateParticipanteDTO extends Partial<CreateParticipanteDTO> {
	id: number;
	foto?: string; // Alias for url_foto
}

export interface ParticipanteResponseDTO {
	id: number;
	nombre: string;
	email: string | null;
	genero: string;
	url_foto?: string;
	foto?: string; // Alias for url_foto
	acreditado: boolean;
	redes_sociales?: string | null;
	created_at?: string;
	updated_at?: string;
	carrera?: {
		id: number;
		nombre: string;
		facultad?: {
			id: number;
			nombre: string;
		};
	} | null;
}

export interface ParticipanteFiltersDTO {
	nombre?: string;
	email?: string;
	genero?: string;
	acreditado?: boolean;
	carrera_id?: number;
	facultad_id?: number;
}
