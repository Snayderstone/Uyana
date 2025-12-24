/**
 * Admin Module - Project Models
 * ------------------------------
 * Entidades relacionadas con proyectos y sus relaciones.
 */

export interface Proyecto {
	id: number;
	estado_id: number;
	codigo: string;
	titulo: string;
	objetivo: string;
	requiere_aval?: boolean;
	fecha_inicio_planeada: Date;
	fecha_fin_planeada: Date;
	fecha_fin_real?: Date;
	cantidad_meses: number;
	porcentaje_avance: number;
	monto_presupuesto_total: number;
	impacto_cientifico: string;
	impacto_economico: string;
	impacto_social: string;
	otros_impactos: string;
	para_siies?: boolean;
	creado_en?: Date;
}

// Tablas de relación proyecto-catálogos

export interface ProyectoInstitucion {
	id: number;
	institucion_id: number;
	proyecto_id: number;
}

export interface ProyectoTipo {
	id: number;
	tipo_id: number;
	proyecto_id: number;
}

export interface ProyectoAreaConocimiento {
	id: number;
	proyecto_id: number;
	area_conocimiento_id: number;
}

export interface ProyectoLineaInvestigacion {
	id: number;
	proyecto_id: number;
	linea_investigacion_id: number;
}

export interface ProyectoFuenteFinanciamiento {
	id: number;
	proyecto_id: number;
	fuente_financiamiento_id: number;
}

export interface ProyectoParticipante {
	id: number;
	proyecto_id: number;
	participante_id: number;
	regimen_dedicacion_id: number;
	cargo_id: number;
}
