// src/lib/services/network.service.ts

import { ProjectService } from "./project.service";
import type { ProyectoFlat } from "$lib/models/project.model";
import type { MapLevel } from "$lib/models/map.model";
import { RelacionesSQLRepository } from "$lib/db/relations.repository";

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
  async buildProjectNetwork(
    payload: {
      focusLevel: MapLevel;
      focusMode: "one" | "all";
      focusId: string | null;

      targetLevel: "faculty" | "institution" | "country";
      targetMode: "one" | "all";
      targetId: string | null;
    },
    centroidesByLevel: Record<MapLevel, Record<string, [number, number]>>,
    proyectosFiltrados?: ProyectoFlat[]
  ): Promise<NetworkResult> {
    const flat = proyectosFiltrados ?? (await ProjectService.getFlatProjectsForUI());

    const normalizeFaculty = (name: string): string => {
      if (!name) return "No especificado";
      let s = name.trim().toLowerCase();
      s = s.replace(/^facultad\s+de\s+/, "");
      s = s.replace(/^facultad\s+/, "");
      s = s.replace(/\s+/g, " ");
      const title = s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `Facultad De ${title}`;
    };

    const entitiesForProject = (p: ProyectoFlat, lvl: "faculty" | "institution"): string[] => {
      if (lvl === "faculty") {
        const list = Array.isArray(p.facultades_relacionadas) ? p.facultades_relacionadas : [];
        return list.map(normalizeFaculty).filter(Boolean);
      }
      const list = Array.isArray(p.instituciones_relacionadas) ? p.instituciones_relacionadas : [];
      return list.map(x => (x ?? "").trim()).filter(Boolean);
    };

    const focusLvl = payload.focusLevel; // faculty | institution
    const targetLvl = payload.targetLevel === "country" ? "institution" : payload.targetLevel; // país aún no

    // 1) edgeMap
    const edgeMap = new Map<string, NetworkEdge>();
    const nodeLevels = new Map<string, MapLevel>(); // id -> level
    const countByNode = new Map<string, number>();

    for (const p of flat) {
      const A = Array.from(new Set(entitiesForProject(p, focusLvl)));
      const B = Array.from(new Set(entitiesForProject(p, targetLvl as any)));

      // filtros foco/target (uno específico)
      const focusSet = payload.focusMode === "one" && payload.focusId ? A.filter(x => x === payload.focusId) : A;
      const targetSet = payload.targetMode === "one" && payload.targetId ? B.filter(x => x === payload.targetId) : B;

      if (focusSet.length === 0 || targetSet.length === 0) continue;

      // nodes presence
      for (const a of focusSet) {
        nodeLevels.set(a, focusLvl);
        countByNode.set(a, (countByNode.get(a) ?? 0) + 1);
      }
      for (const b of targetSet) {
        nodeLevels.set(b, targetLvl as MapLevel);
        countByNode.set(b, (countByNode.get(b) ?? 0) + 1);
      }

      // edges
      if (focusLvl === targetLvl) {
        // dentro del mismo set (clique por proyecto)
        const uniq = Array.from(new Set(focusSet));
        if (uniq.length < 2) continue;

        for (let i = 0; i < uniq.length; i++) {
          for (let j = i + 1; j < uniq.length; j++) {
            const a = uniq[i], b = uniq[j];
            const key = a < b ? `${a}__${b}` : `${b}__${a}`;
            const prev = edgeMap.get(key);
            if (prev) prev.weight += 1;
            else edgeMap.set(key, { source: a < b ? a : b, target: a < b ? b : a, weight: 1, normalized: 0 });
          }
        }
      } else {
        // bipartita: foco ↔ target
        for (const a of focusSet) {
          for (const b of targetSet) {
            if (a === b) continue;
            const key = `${a}__${b}`; // dirección importa por niveles distintos
            const prev = edgeMap.get(key);
            if (prev) prev.weight += 1;
            else edgeMap.set(key, { source: a, target: b, weight: 1, normalized: 0 });
          }
        }
      }
    }

    const edges = Array.from(edgeMap.values());

    // 2) normalizar
    if (edges.length > 0) {
      const weights = edges.map(e => e.weight);
      const min = Math.min(...weights);
      const max = Math.max(...weights);
      edges.forEach(e => (e.normalized = normalizeValue(e.weight, min, max)));
    }

    // 3) nodes (solo los que aparecen en nodeLevels)
    const nodes: NetworkNode[] = Array.from(nodeLevels.entries()).map(([id, lvl]) => {
      const centro = centroidesByLevel[lvl]?.[id] ?? [null, null];
      return {
        id,
        label: id,
        level: lvl,
        lat: centro[0],
        lng: centro[1],
        projectCount: countByNode.get(id) ?? 0
      };
    });

    return { nodes, edges };
  },

  async buildParticipantNetwork(
    payload: {
      focusLevel: MapLevel;
      focusMode: "one" | "all";
      focusId: string | null;

      targetLevel: "faculty" | "institution" | "country";
      targetMode: "one" | "all";
      targetId: string | null;
    },
    centroidesByLevel: Record<MapLevel, Record<string, [number, number]>>,
    proyectosFiltrados?: ProyectoFlat[]
  ): Promise<NetworkResult> {
    const flat = proyectosFiltrados ?? (await ProjectService.getFlatProjectsForUI());

    // ✅ fuente real de participantes (ya normalizada por tu repo)
    const details = await RelacionesSQLRepository.getProjectParticipantsWithDetails();

    const normalizeFaculty = (name: string): string => {
      if (!name) return "No especificado";
      let s = name.trim().toLowerCase();
      s = s.replace(/^facultad\s+de\s+/, "");
      s = s.replace(/^facultad\s+/, "");
      s = s.replace(/\s+/g, " ");
      const title = s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `Facultad De ${title}`;
    };

    // projectId -> Set(participante_id)
    const partsByProject = new Map<number, Set<string>>();
    for (const r of details as any[]) {
      if (!r.proyecto_id || !r.participante_id) continue;
      const pid = r.proyecto_id as number;
      if (!partsByProject.has(pid)) partsByProject.set(pid, new Set());
      partsByProject.get(pid)!.add(String(r.participante_id));
    }

    // projectId -> entities por nivel
    const facsByProject = new Map<number, string[]>();
    const instsByProject = new Map<number, string[]>();
    for (const p of flat) {
      const pid = p.id;
      facsByProject.set(pid, (p.facultades_relacionadas ?? []).map(normalizeFaculty).filter(Boolean));
      instsByProject.set(pid, (p.instituciones_relacionadas ?? []).map(x => (x ?? "").trim()).filter(Boolean));
    }

    const focusLvl = payload.focusLevel;
    const targetLvl = payload.targetLevel === "country" ? "institution" : payload.targetLevel;

    const entitiesForLevel = (pid: number, lvl: MapLevel): string[] =>
      lvl === "faculty" ? (facsByProject.get(pid) ?? []) : (instsByProject.get(pid) ?? []);

    // entity -> Set(participantes)
    const partsByEntity = new Map<string, Set<string>>();
    const nodeLevels = new Map<string, MapLevel>();
    const countByNode = new Map<string, number>();

    // usamos solo proyectos presentes en flat (y por tanto en filtro actual)
    for (const p of flat) {
      const pid = p.id;
      const partSet = partsByProject.get(pid);
      if (!partSet || partSet.size === 0) continue;

      const A = entitiesForLevel(pid, focusLvl);
      const B = entitiesForLevel(pid, targetLvl as any);

      const focusSet = payload.focusMode === "one" && payload.focusId ? A.filter(x => x === payload.focusId) : A;
      const targetSet = payload.targetMode === "one" && payload.targetId ? B.filter(x => x === payload.targetId) : B;

      for (const ent of focusSet) {
        nodeLevels.set(ent, focusLvl);
        if (!partsByEntity.has(ent)) partsByEntity.set(ent, new Set());
        partSet.forEach(x => partsByEntity.get(ent)!.add(x));
        countByNode.set(ent, (countByNode.get(ent) ?? 0) + 1);
      }

      for (const ent of targetSet) {
        nodeLevels.set(ent, targetLvl as MapLevel);
        if (!partsByEntity.has(ent)) partsByEntity.set(ent, new Set());
        partSet.forEach(x => partsByEntity.get(ent)!.add(x));
        countByNode.set(ent, (countByNode.get(ent) ?? 0) + 1);
      }
    }

    // edges por intersección
    const entities = Array.from(partsByEntity.keys());
    const edges: NetworkEdge[] = [];

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const A = entities[i];
        const B = entities[j];

        // si niveles distintos, igual se permite
        const setA = partsByEntity.get(A)!;
        const setB = partsByEntity.get(B)!;

        let inter = 0;
        for (const x of setA) if (setB.has(x)) inter++;

        if (inter > 0) {
          edges.push({ source: A, target: B, weight: inter, normalized: 0 });
        }
      }
    }

    if (edges.length > 0) {
      const weights = edges.map(e => e.weight);
      const min = Math.min(...weights);
      const max = Math.max(...weights);
      edges.forEach(e => (e.normalized = normalizeValue(e.weight, min, max)));
    }

    const nodes: NetworkNode[] = Array.from(nodeLevels.entries()).map(([id, lvl]) => {
      const centro = centroidesByLevel[lvl]?.[id] ?? [null, null];
      return {
        id,
        label: id,
        level: lvl,
        lat: centro[0],
        lng: centro[1],
        projectCount: countByNode.get(id) ?? 0
      };
    });

    return { nodes, edges };
  },

  async buildNetwork(
    payload: {
      type: NetworkRelation;

      focusLevel: MapLevel;
      focusMode: "one" | "all";
      focusId: string | null;

      targetLevel: "faculty" | "institution" | "country";
      targetMode: "one" | "all";
      targetId: string | null;
    },
    centroidesByLevel: Record<MapLevel, Record<string, [number, number]>>,
    proyectosFiltrados?: ProyectoFlat[]
  ): Promise<NetworkResult> {
    const { type } = payload;

    switch (type) {
      case "projects":
      case "area":
        // area = “usa los proyectos filtrados” → no conecta todo el universo
        return this.buildProjectNetwork(payload, centroidesByLevel, proyectosFiltrados);

      case "participants":
        return this.buildParticipantNetwork(payload, centroidesByLevel, proyectosFiltrados);

      case "international":
        // base (vacío por ahora, pero deja el camino)
        return { nodes: [], edges: [] };

      default:
        return { nodes: [], edges: [] };
    }
  }
};
