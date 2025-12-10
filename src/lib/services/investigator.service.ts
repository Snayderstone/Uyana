/**
 * Investigator Service
 * --------------------
 * Construye InvestigatorModel desde múltiples tablas relacionadas.
 */
// src/lib/services/investigator.service.ts

import { supabase } from '$lib/db/supabase.client';
import type { Investigador } from '$lib/models/investigator.model';
import { RelacionesSQLRepository } from '$lib/db/relations.repository';

// ⚙️ Sólo lógica de negocio / transformación, sin crear cliente Supabase aquí.

/**
 * Procesa el string de redes y lo convierte en un array usable por la UI.
 */
export function procesarRedes(redesString: string): Array<{ nombre: string; url: string }> {
  if (!redesString) return [];

  const redes = redesString
    .split('|')
    .map((red) => red.trim())
    .filter((red) => red.length > 0);

  return redes
    .map((red) => {
      let cleanUrl = red;

      if (
        !cleanUrl.startsWith('http://') &&
        !cleanUrl.startsWith('https://') &&
        !cleanUrl.startsWith('mailto:')
      ) {
        if (cleanUrl.toUpperCase().startsWith('HTTPS://')) {
          cleanUrl = cleanUrl.replace(/^HTTPS:\/\//i, 'https://');
        } else if (cleanUrl.includes('@') && !cleanUrl.includes('.')) {
          cleanUrl = `mailto:${cleanUrl}`;
        } else {
          cleanUrl = `https://${cleanUrl}`;
        }
      }

      if (cleanUrl.includes('orcid.org')) {
        return { nombre: 'ORCID', url: cleanUrl };
      } else if (cleanUrl.includes('researchgate.net')) {
        return { nombre: 'ResearchGate', url: cleanUrl };
      } else if (cleanUrl.includes('academia.edu')) {
        return { nombre: 'Academia.edu', url: cleanUrl };
      } else if (cleanUrl.includes('facebook.com')) {
        return { nombre: 'Facebook', url: cleanUrl };
      } else if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
        return { nombre: 'Twitter', url: cleanUrl };
      } else if (cleanUrl.startsWith('mailto:')) {
        return { nombre: 'Email', url: cleanUrl };
      } else {
        try {
          const url = new URL(cleanUrl);
          const domain = url.hostname.replace('www.', '').split('.')[0];
          return { nombre: domain.charAt(0).toUpperCase() + domain.slice(1), url: cleanUrl };
        } catch {
          return null;
        }
      }
    })
    .filter((red) => red !== null) as Array<{ nombre: string; url: string }>;
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
 * Obtiene todos los investigadores desde la BD nueva.
 * OJO: aquí debes asegurarte de apuntar a la tabla correcta.
 */
export async function obtenerInvestigadores(): Promise<Investigador[]> {
  const { data, error } = await supabase.from('investigadores_uce_def').select('*');

  if (error) {
    console.error('Error al obtener investigadores:', error);
    return [];
  }

  return data.map((investigador: Investigador) => ({
    ...investigador,
    redesArray: procesarRedes(investigador.redes)
  }));
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
