/**
 * Admin Module - Participant Models
 * ----------------------------------
 * Entidades relacionadas con participantes/investigadores.
 */

export interface Participante {
	id: number;
	carrera_id: number;
	email: string;
	nombre: string;
	genero: string;
	url_foto?: string;
	acreditado?: boolean;
	redes_sociales?: string;
	linea_investigacion?: string;
}
