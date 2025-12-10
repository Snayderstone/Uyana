//proyectosService.ts
/**
 * Proyectos Service
 * -----------------
 * Lógica de negocio relacionada con proyectos
 */

import { AnalyticsService } from '$lib/services/analytics.service';
import type { GlobalStats } from '$lib/services/analytics.service';
import { ProjectService } from '$lib/services/project.service';
import type { ProyectoFlat } from '$lib/models/project.model';
export type Proyecto = ProyectoFlat;

export {
  obtenerRankingInvestigadores,
  obtenerEstadisticasInvestigador,
  buscarInvestigadores
} from '$lib/services/investigator.service';

export async function obtenerProyectos(): Promise<Proyecto[]> {
  // Delegamos al ProjectService, que ya arma el modelo plano desde la BD normalizada
  return ProjectService.getFlatProjectsForUI();
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
