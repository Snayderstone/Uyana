/**
 * Admin Module - Entities
 * ------------------------
 * Entidades que reflejan el esquema de la base de datos
 * para el módulo de administración.
 */

// =====================================
// Entidades Base
// =====================================

export interface Rol {
	id: number;
	nombre: string;
}

export interface Usuario {
	id: number;
	email: string;
	nombre: string;
	contraseña_hash: string;
	creado_en?: Date;
	actualizado_en?: Date;
}

export interface UsuarioRol {
	id: number;
	usuario_id: number;
	rol_id: number;
	asignado_en?: Date;
}

export interface Sesion {
	id: number;
	usuario_id: number;
	token: string;
	expira_en?: Date;
}

export interface Estado {
	id: number;
	nombre: string;
	descripcion?: string;
}

// =====================================
// Proyecto y relaciones
// =====================================

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

export interface Institucion {
	id: number;
	nombre: string;
	sigla?: string;
	pais?: string;
	geometry?: any; // GeoJSON
}

export interface ProyectoInstitucion {
	id: number;
	institucion_id: number;
	proyecto_id: number;
}

export interface Tipo {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface ProyectoTipo {
	id: number;
	tipo_id: number;
	proyecto_id: number;
}

export interface AreaConocimiento {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface LineaInvestigacion {
	id: number;
	nombre: string;
	descripcion?: string;
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

// =====================================
// Participantes y relaciones
// =====================================

export interface Participante {
	id: number;
	carrera_id: number;
	email: string;
	nombre: string;
	genero: string;
	url_foto?: string;
	acreditado?: boolean;
	redes_sociales?: string;
}

export interface Cargo {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface RegimenDedicacion {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface ProyectoParticipante {
	id: number;
	proyecto_id: number;
	participante_id: number;
	regimen_dedicacion_id: number;
	cargo_id: number;
}

// =====================================
// Financiamiento
// =====================================

export interface FuenteFinanciamiento {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface ProyectoFuenteFinanciamiento {
	id: number;
	proyecto_id: number;
	fuente_financiamiento_id: number;
}

// =====================================
// Estructura académica
// =====================================

export interface Facultad {
	id: number;
	institucion_id: number;
	nombre: string;
	sigla?: string;
	subdecano?: string;
	decano?: string;
	geometry?: any; // GeoJSON
}

export interface Carrera {
	id: number;
	facultad_id: number;
	nombre: string;
	geometry?: any; // GeoJSON
}

// =====================================
// Blog (para RF-MAD-09)
// =====================================

export interface BlogPost {
	id: number;
	titulo: string;
	contenido: string;
	autor_id: number;
	slug: string;
	resumen?: string;
	imagen_portada?: string;
	publicado: boolean;
	fecha_publicacion?: Date;
	vistas?: number;
	tiempo_lectura_min?: number;
	creado_en?: Date;
	actualizado_en?: Date;
}

export interface BlogCategoria {
	id: number;
	nombre: string;
	slug: string;
}

export interface BlogPostCategoria {
	id: number;
	post_id: number;
	categoria_id: number;
}
