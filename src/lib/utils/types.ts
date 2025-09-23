export type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>> };

export type SparkleType = {
	id: string;
	createdAt: number;
	color: string;
	size: number;
	style: any;
};

export type TagType = {
	label: string;
	color?: 'primary' | 'secondary';
};

export type SocialLink = {};

export type Feature = {
	name: string;
	description: string;
	image: string;
	tags: TagType[];
};

export type BlogPost = {
	tags: string[];
	keywords: string[];
	hidden: boolean;
	slug: string;
	title: string;
	date: string;
	updated: string;
	excerpt: string;
	html: string | undefined;
	readingTime: string;
	relatedPosts: BlogPost[];
	coverImage: string | undefined;
};

// Tipos para consultas de proyectos MCP
export type ProyectoConsulta = {
	tipo: 'estadisticas' | 'facultad' | 'busqueda' | 'comparacion' | 'tendencias' | 'investigadores';
	parametros?: {
		facultad?: string;
		terminos?: string[];
		limite?: number;
		filtros?: Record<string, any>;
	};
};

export type RespuestaProyectos = {
	respuesta: string;
	datos: {
		facultades?: Array<{ facultad: string; cantidad: number }>;
		estadisticas?: {
			totalProyectos: number;
			proyectosActivos: number;
			proyectosCerrados: number;
			investigadoresAcreditados: number;
		};
		proyectos?: Array<{
			id: number;
			titulo: string;
			facultad_o_entidad_o_area_responsable: string;
			estado: string;
			objetivo?: string;
		}>;
		metadatos?: {
			timestamp: number;
			consulta: string;
			tipoConsulta: string;
		};
	};
};

export type FacultadEstadisticas = {
	nombre: string;
	totalProyectos: number;
	porcentaje: number;
	estados: {
		ejecucion: number;
		cierre: number;
		cerrados: number;
	};
	ranking: number;
};
