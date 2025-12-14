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
}

export interface ParticipanteResponseDTO {
	id: number;
	nombre: string;
	email: string;
	genero: string;
	url_foto?: string;
	acreditado: boolean;
	redes_sociales?: string;
	carrera: {
		id: number;
		nombre: string;
		facultad: {
			id: number;
			nombre: string;
		};
	};
}
