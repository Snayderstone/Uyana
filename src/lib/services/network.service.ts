// src/lib/services/network.service.ts

import { ProjectService } from "./project.service";
import type { ProyectoFlat } from "$lib/models/project.model";
import type { MapLevel } from "$lib/models/map.model";

export type NetworkRelation =
  | "projects"        // co-participación en proyectos
  | "participants"    // co-autoría por participantes
  | "international"   // colaboración por país
  | "area";           // redes por área

export interface NetworkNode {
  id: string;
  label: string;
  level: MapLevel;
  lat: number | null;
  lng: number | null;
  projectCount: number;
  extra?: any;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  normalized: number;
  extra?: any;
}

export interface NetworkResult {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

/**
 * 🔥 Normalizador para mantener valores entre 0–1
 */
function normalizeValue(v: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (v - min) / (max - min);
}

export const NetworkService = {
  /**
   * ================================================================================
   *   RELACIÓN 1 — CO-PARTICIPACIÓN EN PROYECTOS
   *   Conecta facultades o instituciones que comparten ≥1 proyecto
   * ================================================================================
   */
  async buildProjectCoParticipationNetwork(
    level: MapLevel,
    centroides: Record<string, [number, number]>,
    proyectosFiltrados?: ProyectoFlat[]
  ): Promise<NetworkResult> {
    const flat = proyectosFiltrados ?? (await ProjectService.getFlatProjectsForUI());

    function normalizeFaculty(name: string): string {
      if (!name) return "No especificado";
      let s = name.trim().toLowerCase();
      s = s.replace(/^facultad\s+de\s+/, "");
      s = s.replace(/^facultad\s+/, "");
      s = s.replace(/\s+/g, " ");
      const title = s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `Facultad De ${title}`;
    }

    const getEntitiesForProject = (p: ProyectoFlat): string[] => {
      if (level === "faculty") {
        const list = Array.isArray(p.facultades_relacionadas) ? p.facultades_relacionadas : [];
        return list.map(normalizeFaculty).filter(Boolean);
      } else {
        const list = Array.isArray(p.instituciones_relacionadas) ? p.instituciones_relacionadas : [];
        return list.map(x => (x ?? "").trim()).filter(Boolean);
      }
    };

    // 1) Conteo por entidad y presencia
    const countByEntity = new Map<string, number>();
    const entitiesSet = new Set<string>();

    flat.forEach((p) => {
      const entities = getEntitiesForProject(p);
      entities.forEach((e) => {
        entitiesSet.add(e);
        countByEntity.set(e, (countByEntity.get(e) ?? 0) + 1);
      });
    });

    // 2) Nodos con centroides
    const nodes: NetworkNode[] = Array.from(entitiesSet).map((name) => {
      const centro = centroides[name] ?? [null, null];
      return {
        id: name,
        label: name,
        level,
        lat: centro[0],
        lng: centro[1],
        projectCount: countByEntity.get(name) ?? 0
      };
    });

    // 3) Edges: por cada proyecto, conectar pares dentro del mismo proyecto
    const edgeMap = new Map<string, NetworkEdge>();

    flat.forEach((p) => {
      const entities = Array.from(new Set(getEntitiesForProject(p)));
      if (entities.length < 2) return;

      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const a = entities[i];
          const b = entities[j];
          const key = a < b ? `${a}__${b}` : `${b}__${a}`;

          const prev = edgeMap.get(key);
          if (prev) {
            prev.weight += 1;
          } else {
            edgeMap.set(key, {
              source: a < b ? a : b,
              target: a < b ? b : a,
              weight: 1,
              normalized: 0,
              extra: { sharedProjects: [p.id] }
            });
          }
        }
      }
    });

    const edges = Array.from(edgeMap.values());

    // 4) Normalizar
    if (edges.length > 0) {
      const weights = edges.map((e) => e.weight);
      const min = Math.min(...weights);
      const max = Math.max(...weights);
      edges.forEach((e) => (e.normalized = normalizeValue(e.weight, min, max)));
    }

    console.log("🔍 Centroides:", centroides);
    return { nodes, edges };

  },
  /**
 * ================================================================================
 *   RELACIÓN 2 — CO-AUTORÍA POR PARTICIPANTES
 *   Conecta facultades o instituciones que comparten ≥1 participante
 * ================================================================================
 */
  async buildParticipantCoAuthorshipNetwork(
    level: MapLevel,
    centroides: Record<string, [number, number]>,
    proyectosFiltrados?: ProyectoFlat[]
  ): Promise<NetworkResult> {
    const flat = proyectosFiltrados ?? (await ProjectService.getFlatProjectsForUI());

    function normalizeFaculty(name: string): string {
      if (!name) return "No especificado";
      let s = name.trim().toLowerCase();
      s = s.replace(/^facultad\s+de\s+/, "");
      s = s.replace(/^facultad\s+/, "");
      s = s.replace(/\s+/g, " ");
      const title = s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `Facultad De ${title}`;
    }
    const groupKey = (p: ProyectoFlat): string => {
      if (level === "faculty") {
        return normalizeFaculty(p.facultad_o_entidad_o_area_responsable ?? "No especificado");
      }
      return (p.institucion ?? "Sin institución").trim();
    };

    // 1. Agrupar participantes por entidad
    const participantsByEntity = new Map<string, Set<string>>();
    const countByEntity = new Map<string, number>();

    flat.forEach((p) => {
      const key = groupKey(p);
      if (!key) return;

      // Extraer participantes (puedes ajustar el campo según tu modelo real)
      // Aquí asumo que tienes un campo tipo string con nombres separados por coma
      const participantes = (p.investigadores_acreditados_senescyt || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      if (!participantsByEntity.has(key)) {
        participantsByEntity.set(key, new Set());
      }
      participantes.forEach((nombre) => {
        participantsByEntity.get(key)!.add(nombre);
      });

      countByEntity.set(key, (countByEntity.get(key) ?? 0) + 1);
    });

    // 2. Crear nodos
    const nodes: NetworkNode[] = [];
    for (const [name, participantSet] of participantsByEntity.entries()) {
      const centro = centroides[name] ?? [null, null];
      nodes.push({
        id: name,
        label: name,
        level,
        lat: centro[0],
        lng: centro[1],
        projectCount: countByEntity.get(name) ?? 0,
      });
    }

    // 3. Crear arcos (edges) por participantes compartidos
    const edges: NetworkEdge[] = [];
    const entities = Array.from(participantsByEntity.keys());

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const A = entities[i];
        const B = entities[j];

        const setA = participantsByEntity.get(A)!;
        const setB = participantsByEntity.get(B)!;

        // Participantes compartidos
        const inter = [...setA].filter((x) => setB.has(x));

        if (inter.length > 0) {
          edges.push({
            source: A,
            target: B,
            weight: inter.length,
            normalized: 0, // luego ajustamos
            extra: { sharedParticipants: inter }
          });
        }
      }
    }

    // 4. Normalizar pesos 0–1
    const weights = edges.map((e) => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);

    edges.forEach((e) => {
      e.normalized = normalizeValue(e.weight, min, max);
    });

    return { nodes, edges };
  },

  async buildNetwork(
    type: NetworkRelation,
    level: MapLevel,
    centroides: Record<string, [number, number]>,
    proyectosFiltrados?: ProyectoFlat[]
  ): Promise<NetworkResult> {

    switch (type) {
      case "projects":
        return this.buildProjectCoParticipationNetwork(level, centroides, proyectosFiltrados);

      case "participants":
        console.warn("⚠️ buildNetwork: Método para participantes no implementado todavía");
        return this.buildParticipantCoAuthorshipNetwork(level, centroides, proyectosFiltrados);

      case "international":
        console.warn("⚠️ buildNetwork: Método internacional no implementado todavía");
        return { nodes: [], edges: [] };

      case "area":
        console.warn("⚠️ buildNetwork: Método por área no implementado todavía");
        return { nodes: [], edges: [] };

      default:
        console.error("❌ Tipo de red no reconocido:", type);
        return { nodes: [], edges: [] };
    }
  }
};
