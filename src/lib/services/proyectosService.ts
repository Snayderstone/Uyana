import { supabase } from '$lib/supabase';

export type Proyecto = {
	id: number;
	codigo: string;
	titulo: string;
	tipo_proyecto: string;
	objetivo: string;
	estado: string;
	facultad_o_entidad_o_area_responsable: string;
	fecha_inicio: string;
	fecha_fin_planeado: string;
	coordinador_director: string;
	correo_electronico_coordinador: string;
	campo_amplio: string;
	campo_especifico: string;
	campo_detallado: string;
	alcance_territorial: string;
	investigadores_acreditados_senescyt: string;
	fuente_financiamiento: string;
};

export async function obtenerProyectos(): Promise<Proyecto[]> {
	const { data, error } = await supabase.from('proyectos_siies_uce').select('*');

	if (error) {
		console.error('Error al obtener proyectos:', error);
		return [];
	}

	return data || [];
}

export async function obtenerProyectosPorEstado(): Promise<{ estado: string; cantidad: number }[]> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por estado
	const estadoCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const estado = proyecto.estado || 'No especificado';
		estadoCount[estado] = (estadoCount[estado] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(estadoCount).map(([estado, cantidad]) => ({
		estado,
		cantidad
	}));
}

export async function obtenerProyectosPorFacultad(): Promise<
	{ facultad: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por facultad
	const facultadCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const facultad = proyecto.facultad_o_entidad_o_area_responsable || 'No especificado';
		facultadCount[facultad] = (facultadCount[facultad] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return (
		Object.entries(facultadCount)
			.map(([facultad, cantidad]) => ({
				facultad,
				cantidad
			}))
			// Ordenar de mayor a menor
			.sort((a, b) => b.cantidad - a.cantidad)
	);
}

export async function obtenerProyectosPorCampoAmplio(): Promise<
	{ campo: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por campo amplio
	const campoCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const campo = proyecto.campo_amplio || 'No especificado';
		campoCount[campo] = (campoCount[campo] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return (
		Object.entries(campoCount)
			.map(([campo, cantidad]) => ({
				campo,
				cantidad
			}))
			// Ordenar de mayor a menor
			.sort((a, b) => b.cantidad - a.cantidad)
	);
}

export async function obtenerProyectosPorAlcance(): Promise<
	{ alcance: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por alcance territorial
	const alcanceCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const alcance = proyecto.alcance_territorial || 'No especificado';
		alcanceCount[alcance] = (alcanceCount[alcance] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(alcanceCount).map(([alcance, cantidad]) => ({
		alcance,
		cantidad
	}));
}

export async function obtenerProyectosPorFinanciamiento(): Promise<
	{ fuente: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por fuente de financiamiento
	const fuenteCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const fuente = proyecto.fuente_financiamiento || 'No especificado';
		fuenteCount[fuente] = (fuenteCount[fuente] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(fuenteCount).map(([fuente, cantidad]) => ({
		fuente,
		cantidad
	}));
}

// Función para obtener estadísticas generales de los proyectos
export async function obtenerProyectosPorTipo(): Promise<{ tipo: string; cantidad: number }[]> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por tipo de proyecto
	const tipoCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const tipo = proyecto.tipo_proyecto || 'No especificado';
		tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(tipoCount)
		.map(([tipo, cantidad]) => ({
			tipo,
			cantidad
		}))
		.sort((a, b) => b.cantidad - a.cantidad);
}

export async function obtenerEstadisticasGenerales(): Promise<{
	totalProyectos: number;
	proyectosActivos: number;
	proyectosCerrados: number;
	investigadoresAcreditados: number;
	proyectosPorTipoPrincipal: { tipo: string; cantidad: number };
}> {
	const proyectos = await obtenerProyectos();
	const tiposProyectos = await obtenerProyectosPorTipo();

	if (proyectos.length === 0) {
		return {
			totalProyectos: 0,
			proyectosActivos: 0,
			proyectosCerrados: 0,
			investigadoresAcreditados: 0,
			proyectosPorTipoPrincipal: { tipo: 'No hay datos', cantidad: 0 }
		};
	}

	// Calcular estadísticas
	const totalProyectos = proyectos.length;

	const proyectosActivos = proyectos.filter(
		(p) => p.estado === 'En ejecución' || p.estado === 'En cierre'
	).length;

	const proyectosCerrados = proyectos.filter(
		(p) => p.estado === 'Cerrado' || p.estado === 'Finalizado'
	).length;

	const investigadoresAcreditados = proyectos.filter(
		(p) => p.investigadores_acreditados_senescyt === 'SI'
	).length;

	// Obtener el tipo de proyecto más común
	const proyectosPorTipoPrincipal =
		tiposProyectos.length > 0 ? tiposProyectos[0] : { tipo: 'No hay datos', cantidad: 0 };

	return {
		totalProyectos,
		proyectosActivos,
		proyectosCerrados,
		investigadoresAcreditados,
		proyectosPorTipoPrincipal
	};
}
