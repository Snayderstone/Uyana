/**
 * Admin Module - Project DTOs
 * ----------------------------
 * DTOs para proyectos y sus operaciones CRUD.
 */

export interface CreateProyectoDTO {
	codigo: string;
	titulo: string;
	objetivo: string;
	estado_id: number;
	requiere_aval?: boolean;
	fecha_inicio_planeada: string; // ISO string
	fecha_fin_planeada: string;
	fecha_fin_real?: string; // ISO string
	cantidad_meses: number;
	porcentaje_avance: number;
	monto_presupuesto_total: number;
	impacto_cientifico: string;
	impacto_economico: string;
	impacto_social: string;
	otros_impactos: string;
	para_siies?: boolean;

	// Relaciones (IDs)
	instituciones_ids: number[]; // Instituciones encargadas del proyecto
	tipos_ids: number[];
	areas_conocimiento_ids: number[];
	lineas_investigacion_ids: number[];
	fuentes_financiamiento_ids: number[];

	// Participantes con sus roles
	participantes: {
		participante_id: number;
		cargo_id: number;
		regimen_dedicacion_id: number;
	}[];
}

export interface UpdateProyectoDTO extends Partial<CreateProyectoDTO> {
	id: number;
	fecha_fin_real?: string;
}

export interface ProyectoResponseDTO {
	id: number;
	codigo: string;
	titulo: string;
	objetivo: string;
	estado: {
		id: number;
		nombre: string;
	};
	requiere_aval: boolean;
	fecha_inicio_planeada: string;
	fecha_fin_planeada: string;
	fecha_fin_real?: string;
	cantidad_meses: number;
	porcentaje_avance: number;
	monto_presupuesto_total: number;
	impacto_cientifico: string;
	impacto_economico: string;
	impacto_social: string;
	otros_impactos: string;
	para_siies: boolean;
	creado_en: string;

	// Relaciones expandidas
	instituciones: Array<{
		id: number;
		nombre: string;
		sigla?: string;
	}>;
	tipos: Array<{
		id: number;
		nombre: string;
	}>;
	areas_conocimiento: Array<{
		id: number;
		nombre: string;
	}>;
	lineas_investigacion: Array<{
		id: number;
		nombre: string;
	}>;
	fuentes_financiamiento: Array<{
		id: number;
		nombre: string;
	}>;
	participantes: Array<{
		id: number;
		nombre: string;
		email: string;
		cargo: string;
		regimen_dedicacion: string;
	}>;
}

export interface ProyectoFiltersDTO {
	codigo?: string;
	titulo?: string;
	estado_id?: number;
	institucion_id?: number;
	facultad_id?: number;
	area_id?: number;
	linea_id?: number;
	tipo_id?: number;
	fecha_inicio_desde?: string;
	fecha_inicio_hasta?: string;
	fecha_fin_desde?: string;
	fecha_fin_hasta?: string;
	participante_id?: number;
	acreditado?: boolean;
	requiere_aval?: boolean;
	acreditado_senescyt?: boolean;
	presupuesto_min?: number;
	presupuesto_max?: number;
	avance_min?: number;
	avance_max?: number;
}

export interface ListProyectosResponseDTO {
	data: ProyectoResponseDTO[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		total_pages: number;
	};
}

export interface ImportProyectoRowDTO {
	codigo_proyecto: string;
	proyecto_para_siies?: string;
	titulo_proyecto: string;
	tipo_proyecto: string;
	area_conocimiento: string;
	linea_investigacion: string;
	objetivo: string;
	impacto_cientifico: string;
	impacto_economico: string;
	impacto_social: string;
	otros_impactos: string;
	estado: string;
	requiere_aval?: string;
	fecha_inicio: string;
	meses: number;
	fecha_fin: string;
	fecha_real_finalizacion?: string;
	nombre_participante: string;
	correo_electronico_participante: string;
	foto_url_participante?: string;
	redes_participante?: string;
	investigador_acreditado?: string;
	institucion_encargada_del_proyecto: string;
	sigla_institucion?: string;
	pais_institucion?: string;
	geometria_institucion?: string;
	facultad_participante: string;
	sigla_facultad?: string;
	decano_facultad?: string;
	subdecano_facultad?: string;
	geometria_facultad?: string;
	carrera_participante: string;
	geometria_carrera?: string;
	genero_participante: string;
	cargo_dentro_del_proyecto: string;
	tiempo_dedicacion_en_el_proyecto: string;
	tipo_presupuesto: string;
	presupuesto: number;
	avance: number;
}

export interface ImportResultDTO {
	success: boolean;
	imported_count: number;
	failed_count: number;
	errors: Array<{
		row: number;
		message: string;
		data?: any;
	}>;
	warnings: Array<{
		row: number;
		message: string;
	}>;
}
