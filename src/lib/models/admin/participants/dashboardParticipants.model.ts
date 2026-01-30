/**
 * Admin Module - Participants Dashboard Models
 * ---------------------------------------------
 * Modelos para las vistas materializadas del dashboard de participantes
 */

/**
 * Estadísticas generales de participantes
 */
export interface ParticipantsStats {
	total_participantes: number;
	total_acreditados: number;
	total_no_acreditados: number;
	total_acreditado_no_especifica : number;
	total_masculino: number;
	total_femenino: number;
	total_genero_no_especifica: number;
	total_otro_genero: number;
}

/**
 * Top Facultades con distribución por género
 */
export interface TopFacultad {
	facultad_id: number;
	facultad_nombre: string;
	total_participantes: number;
	masculino: number;
	femenino: number;
}

/**
 * Top Carreras con distribución por género
 */
export interface TopCarrera {
	carrera_id: number;
	carrera_nombre: string;
	facultad_nombre: string;
	total_participantes: number;
	masculino: number;
	femenino: number;
}

/**
 * Top Cargos con distribución por género
 */
export interface TopCargo {
	cargo_id: number;
	cargo_nombre: string;
	total_asignaciones: number;
	masculino: number;
	femenino: number;
}

/**
 * Top Participantes con más proyectos
 */
export interface TopParticipanteProyectos {
	participante_id: number;
	participante_nombre: string;
	email: string | null;
	url_foto: string | null;
	redes_sociales: string | null;
	genero: string;
	acreditado: boolean;
	carrera_nombre: string;
	facultad_nombre: string;
	proyectos_en_direccion: number;
	monto_total_direccion: number;
	monto_maximo_direccion: number;
	monto_promedio_direccion: number;
}

/**
 * Participación directiva por género
 */
export interface ParticipacionDirectivaGenero {
	genero: string;
	total_roles_directivos: number;
	participantes_unicos: number;
	proyectos_unicos: number;
}

/**
 * Facultad × Género
 */
export interface FacultadGenero {
	facultad_id: number;
	facultad_nombre: string;
	masculino: number;
	femenino: number;
	total: number;
}

/**
 * Cargo × Género
 */
export interface CargoGenero {
	cargo_id: number;
	cargo_nombre: string;
	masculino: number;
	femenino: number;
	total: number;
}

/**
 * Dashboard completo de participantes
 */
export interface ParticipantsDashboardData {
	stats: ParticipantsStats;
	topFacultades: TopFacultad[];
	topCarreras: TopCarrera[];
	topCargos: TopCargo[];
	topParticipantes: TopParticipanteProyectos[];
	participacionDirectiva: ParticipacionDirectivaGenero[];
	facultadGenero: FacultadGenero[];
	cargoGenero: CargoGenero[];
}

/**
 * Respuesta de la API del dashboard
 */
export interface ParticipantsDashboardResponse {
	success: boolean;
	data?: ParticipantsDashboardData;
	error?: string;
	message?: string;
}
