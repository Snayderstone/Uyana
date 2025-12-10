//proyectosService.ts
/**
 * Proyectos Service
 * -----------------
 * Lógica de negocio relacionada con proyectos
 */

import { supabase } from '$lib/db/supabase.client';
import { AnalyticsService } from '$lib/services/analytics.service';
import type { GlobalStats } from '$lib/services/analytics.service';
import { RelacionesSQLRepository } from '$lib/db/relations.repository';

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
	// 👇 OJO: cambia 'proyectos' por el nombre real si tu tabla/vista se llama distinto
	const { data, error } = await supabase.from('proyectos').select('*');

	if (error) {
		console.error('Error al obtener proyectos:', error);
		return [];
	}

	return data || [];
}
// Versión nueva: delega al AnalyticsService (BD normalizada)
export async function obtenerProyectosPorEstado(): Promise<{ estado: string; cantidad: number }[]> {
  return AnalyticsService.getProjectsByState();
}
// Versión nueva: delega al AnalyticsService (BD normalizada)
export async function obtenerProyectosPorFacultad(): Promise<
  { facultad: string; cantidad: number }[]
> {
  // Nueva versión: usa BD normalizada vía AnalyticsService
  return AnalyticsService.getProjectsByFacultyOverview();
}
export async function obtenerProyectosPorCampoAmplio(): Promise<
  { campo: string; cantidad: number }[]
> {
  // Nueva versión: usamos BD normalizada (áreas de conocimiento)
  const stats = await AnalyticsService.getProjectsByArea();

  // Adaptamos nombres: area → campo (para no romper la UI)
  return stats.map(({ area, cantidad }) => ({
    campo: area,
    cantidad
  }));
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
  // Nueva versión: usa BD normalizada (fuente_financiamiento + proyecto_fuente_financiamiento)
  return AnalyticsService.getProjectsByFundingSource();
}
// Función para obtener proyectos por tipo (versión nueva, usando BD normalizada)
export async function obtenerProyectosPorTipo(): Promise<{ tipo: string; cantidad: number }[]> {
  // Delegamos al AnalyticsService, que ya trabaja con proyecto_tipo + tipos
  return AnalyticsService.getProjectsByType();
}

/**
 * Estadísticas generales de proyectos (versión nueva)
 * ---------------------------------------------------
 * Esta función mantiene la MISMA firma que usaba tu UI,
 * pero por dentro delega al nuevo AnalyticsService,
 * que trabaja con la BD normalizada.
 *
 * ⚠️ IMPORTANTE:
 *  - NO usamos más `obtenerProyectos()` aquí.
 *  - Si en algún momento cambias la forma de las estadísticas,
 *    cambia primero AnalyticsService.getGlobalStats() y aquí
 *    solo adaptas el shape si hace falta.
 */
export async function obtenerEstadisticasGenerales(): Promise<{
  totalProyectos: number;
  proyectosActivos: number;
  proyectosCerrados: number;
  investigadoresAcreditados: number;
  proyectosPorTipoPrincipal: { tipo: string; cantidad: number };
}> {
  // Usamos el servicio nuevo, que ya hace todos los joins
  const stats: GlobalStats = await AnalyticsService.getGlobalStats();

  // Adaptamos el resultado al formato que ya usaba tu dashboard
  return {
    totalProyectos: stats.totalProyectos,
    proyectosActivos: stats.proyectosActivos,
    proyectosCerrados: stats.proyectosCerrados,
    investigadoresAcreditados: stats.investigadoresAcreditados,
    proyectosPorTipoPrincipal:
      stats.proyectosPorTipoPrincipal ?? { tipo: 'No hay datos', cantidad: 0 }
  };
}
export async function obtenerEstadisticasPorFacultad(nombreFacultad: string) {
  // Nueva versión: delega completamente al AnalyticsService
  return AnalyticsService.getFacultyStats(nombreFacultad);
}
/** 🔹 Helper interno: decide si un cargo indica rol de líder del proyecto */
function esRolLider(cargoNombre?: string | null): boolean {
  if (!cargoNombre) return false;
  const texto = cargoNombre.toLowerCase();

  return (
    texto.includes('director') ||
    texto.includes('directora') ||
    texto.includes('coordinador') ||
    texto.includes('coordinadora') ||
    texto.includes('investigador principal') ||
    texto.includes('responsable')
  );
}
/**
 * Ranking de investigadores por número de PROYECTOS donde son líderes
 * (director/coordinador/etc, según el cargo).
 */
export async function obtenerRankingInvestigadores(limite: number = 10): Promise<
  Array<{
    investigador: string;
    total_proyectos: number;
    proyectos_activos: number;
    proyectos_completados: number;
    detalles_proyectos: Array<{
      codigo: string;
      titulo: string;
      estado: string;
      facultad: string;
    }>;
  }>
> {
  try {
    const rows = await RelacionesSQLRepository.getProjectParticipantsWithDetails();

    const agrupacion = new Map<
      string,
      {
        total: number;
        activos: number;
        completados: number;
        proyectos: Array<{
          codigo: string;
          titulo: string;
          estado: string;
          facultad: string;
        }>;
      }
    >();

    rows.forEach((row: any) => {
      if (!esRolLider(row.cargo_nombre)) return;

      const nombre = (row.participante_nombre ?? '').trim();
      if (!nombre) return;

      if (!agrupacion.has(nombre)) {
        agrupacion.set(nombre, {
          total: 0,
          activos: 0,
          completados: 0,
          proyectos: []
        });
      }

      const stats = agrupacion.get(nombre)!;
      stats.total++;

      const estado = (row.estado ?? '').toLowerCase();
      if (estado.includes('ejecución') || estado.includes('ejecucion') || estado.includes('activo')) {
        stats.activos++;
      } else if (
        estado.includes('finalizado') ||
        estado.includes('completado') ||
        estado.includes('cierre')
      ) {
        stats.completados++;
      }

      stats.proyectos.push({
        codigo: row.codigo || '',
        titulo: row.titulo || '',
        estado: row.estado || '',
        facultad: row.facultad || ''
      });
    });

    const ranking = Array.from(agrupacion.entries())
      .map(([investigador, stats]) => ({
        investigador,
        total_proyectos: stats.total,
        proyectos_activos: stats.activos,
        proyectos_completados: stats.completados,
        detalles_proyectos: stats.proyectos
      }))
      .sort((a, b) => b.total_proyectos - a.total_proyectos)
      .slice(0, limite);

    return ranking;
  } catch (error) {
    console.error('Error al obtener ranking de investigadores:', error);
    throw new Error('Error al obtener el ranking de investigadores');
  }
}
/**
 * 🔹 NUEVA VERSIÓN (BD normalizada)
 * Estadísticas detalladas de un investigador específico
 * considerando solo los proyectos donde tiene rol de líder.
 */
export async function obtenerEstadisticasInvestigador(nombreInvestigador: string): Promise<{
  investigador: string;
  total_proyectos: number;
  proyectos_por_estado: Record<string, number>;
  proyectos_por_facultad: Record<string, number>;
  proyectos_por_año: Record<string, number>;
  detalles_proyectos: Array<{
    codigo: string;
    titulo: string;
    estado: string;
    facultad: string;
    fecha_inicio: string;
    fecha_fin: string;
  }>;
} | null> {
  try {
    const rows = await RelacionesSQLRepository.getProjectParticipantsWithDetails();
    const termino = nombreInvestigador.toLowerCase().trim();

    const filtrados = rows.filter((row: any) => {
      if (!esRolLider(row.cargo_nombre)) return false;
      const nombre = (row.participante_nombre ?? '').toLowerCase();
      return nombre.includes(termino);
    });

    if (!filtrados.length) {
      return null;
    }

    const proyectosPorEstado: Record<string, number> = {};
    const proyectosPorFacultad: Record<string, number> = {};
    const proyectosPorAño: Record<string, number> = {};
    const detallesProyectos: Array<{
      codigo: string;
      titulo: string;
      estado: string;
      facultad: string;
      fecha_inicio: string;
      fecha_fin: string;
    }> = [];

    filtrados.forEach((row: any) => {
      const estado = row.estado || 'Sin estado';
      proyectosPorEstado[estado] = (proyectosPorEstado[estado] || 0) + 1;

      const facultad = row.facultad || 'Sin facultad';
      proyectosPorFacultad[facultad] = (proyectosPorFacultad[facultad] || 0) + 1;

      const fechaInicio: string | null = row.fecha_inicio_planeada ?? null;
      if (fechaInicio) {
        const year = new Date(fechaInicio).getFullYear().toString();
        proyectosPorAño[year] = (proyectosPorAño[year] || 0) + 1;
      }

      detallesProyectos.push({
        codigo: row.codigo || '',
        titulo: row.titulo || '',
        estado: row.estado || '',
        facultad: row.facultad || '',
        fecha_inicio: row.fecha_inicio_planeada ?? '',
        fecha_fin: row.fecha_fin_planeada ?? ''
      });
    });

    return {
      investigador: nombreInvestigador,
      total_proyectos: filtrados.length,
      proyectos_por_estado: proyectosPorEstado,
      proyectos_por_facultad: proyectosPorFacultad,
      proyectos_por_año: proyectosPorAño,
      detalles_proyectos: detallesProyectos
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de investigador:', error);
    throw new Error('Error al obtener las estadísticas del investigador');
  }
}

/**
 * Busca investigadores por término de búsqueda
 * (se apoya en el ranking ya normalizado)
 */
export async function buscarInvestigadores(
  termino: string
): Promise<Array<{ investigador: string; total_proyectos: number }>> {
  try {
    const ranking = await obtenerRankingInvestigadores(50);
    const terminoNormalizado = termino.toLowerCase().trim();

    return ranking
      .filter((inv) => inv.investigador.toLowerCase().includes(terminoNormalizado))
      .map((inv) => ({
        investigador: inv.investigador,
        total_proyectos: inv.total_proyectos
      }));
  } catch (error) {
    console.error('Error al buscar investigadores:', error);
    throw new Error('Error al buscar investigadores');
  }
}
