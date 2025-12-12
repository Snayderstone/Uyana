<!-- src/lib/components/molecules/MapParticipantsDashboard.svelte -->
<script lang="ts">
  import type { MapParticipantForUI } from '$lib/models/map-participants.model';
  import CircularStatus from '../molecules/CircularStatus.svelte';
  import DonutChart from './DonutChart.svelte';
  import TubeBarChart from './TubeBarChart.svelte';

  // Participantes filtrados (los que llegan desde el Explorer)
  export let participants: MapParticipantForUI[] = [];
  // Opcional: total general de participantes (si el padre quiere pasarlo).
  // Si no llega, usamos participants.length como total.
  export let totalGeneral: number | null = null;

  // ================== Helpers de acceso ==================
  function getAny(p: any, keys: string[], fallback: any = null) {
    for (const k of keys) {
      if (p[k] !== undefined && p[k] !== null && String(p[k]).trim() !== '') {
        return p[k];
      }
    }
    return fallback;
  }

  function getFacultyFromParticipant(p: MapParticipantForUI): string | null {
    return getAny(p, [
      'facultyName',
      'facultad',
      'facultadNombre',
      'facultad_o_entidad_o_area_responsable'
    ]);
  }

  function getInstitutionsFromParticipant(p: MapParticipantForUI): string[] {
    const anyP = p as any;
    const main = getAny(anyP, ['institutionName', 'institucion', 'institucionPrincipal'], null);
    const related = getAny(anyP, ['institutionsRelated', 'instituciones_relacionadas'], []) ?? [];

    const result: string[] = [];
    if (main) result.push(String(main));
    if (Array.isArray(related)) {
      for (const r of related) {
        if (r) result.push(String(r));
      }
    }
    return result;
  }

  function getParticipantType(p: MapParticipantForUI): string {
    return (
      getAny(p, ['participantType', 'tipoParticipante', 'tipo']) ||
      'Participante'
    );
  }

  function getParticipantRole(p: MapParticipantForUI): string | null {
    return getAny(p, ['rol', 'rolEnProyecto', 'rol_en_proyecto'], null);
  }

  function getParticipantCountry(p: MapParticipantForUI): string | null {
    return getAny(p as any, ['country', 'pais'], null);
  }

  function getParticipantGender(p: MapParticipantForUI): string | null {
    return getAny(p as any, ['gender', 'genero', 'sexo'], null);
  }

  function getParticipantName(p: MapParticipantForUI): string {
    const anyP = p as any;
    return (
      getAny(anyP, ['fullName', 'nombreCompleto'], null) ||
      `${anyP.apellidos ?? ''} ${anyP.nombres ?? ''}`.trim() ||
      anyP.nombre ||
      'Participante sin nombre'
    );
  }

  // ================== Helpers de conteo ==================
  type CountItem = { label: string; value: number };

  function countBy(
    lista: MapParticipantForUI[],
    selector: (p: MapParticipantForUI) => string | null | undefined
  ): CountItem[] {
    const counts: Record<string, number> = {};

    for (const p of lista) {
      let label = selector(p);
      if (!label || String(label).trim() === '') {
        label = 'No especificado';
      }
      const key = String(label);
      counts[key] = (counts[key] || 0) + 1;
    }

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }

  // Para campos donde hay múltiples valores posibles (ej: instituciones relacionadas)
  function countByMany(
    lista: MapParticipantForUI[],
    selector: (p: MapParticipantForUI) => string[]
  ): CountItem[] {
    const counts: Record<string, number> = {};

    for (const p of lista) {
      const labels = selector(p);
      if (!labels || labels.length === 0) {
        counts['No especificado'] = (counts['No especificado'] || 0) + 1;
        continue;
      }

      for (const raw of labels) {
        const label = raw && String(raw).trim() ? String(raw) : 'No especificado';
        counts[label] = (counts[label] || 0) + 1;
      }
    }

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }

  // ================= Colorear datasets ==================
  function asignarColores(
    data: CountItem[]
  ): (CountItem & { colorVarName: string })[] {
    if (!data || data.length === 0) return [];

    const maxVal = Math.max(...data.map((d) => d.value));
    if (maxVal === 0) {
      // si todos son 0, asignamos un color neutro
      return data.map((item) => ({
        ...item,
        colorVarName: '--color--secondary'
      }));
    }

    return data.map((item) => {
      const ratio = item.value / maxVal; // 0–1 relativo al máximo

      let colorVarName = '--color--secondary';
      if (ratio >= 0.75) {
        colorVarName = '--color--callout-accent--success';
      } else if (ratio >= 0.5) {
        colorVarName = '--color--primary';
      } else if (ratio >= 0.25) {
        colorVarName = '--color--callout-accent--warning';
      } else {
        colorVarName = '--color--callout-accent--error';
      }

      return { ...item, colorVarName };
    });
  }

  function topN(data: CountItem[], n: number): CountItem[] {
    return [...data].sort((a, b) => b.value - a.value).slice(0, n);
  }

  // ================== Datasets ==================
  $: totalGeneralResolved = totalGeneral ?? participants.length;

  // 1. General (filtrados vs total)
  $: dataGeneral = [
    { label: 'Filtrados', value: participants.length },
    { label: 'Total general', value: totalGeneralResolved }
  ];

  // 2. Por facultad
  $: dataFacultad = countBy(participants, getFacultyFromParticipant);

  // 3. Por institución (considerando principal y relacionadas)
  $: dataInstitucion = countByMany(participants, getInstitutionsFromParticipant);

  // 4. Por tipo de participante
  $: dataTipo = countBy(participants, (p) => getParticipantType(p));

  // 5. Por rol
  $: dataRol = countBy(participants, (p) => getParticipantRole(p));

  // 6. Por país
  $: dataPais = countBy(participants, getParticipantCountry);

  // 7. Por género
  $: dataGenero = countBy(participants, getParticipantGender);

  // 8. Top 10 facultades con más participantes
  $: dataTopFacultades = topN(dataFacultad, 10);
  // 9. Top 10 instituciones con más participantes
  $: dataTopInstituciones = topN(dataInstitucion, 10);
</script>

<div class="dashboard">
  <!-- 1. Circular filtrados vs total -->
  <CircularStatus
    title="Participantes filtrados"
    value={participants.length}
    total={totalGeneralResolved}
    unit="Participantes"
    status="primary"
    size="md"
  />

  <!-- 2. Participantes por Facultad -->
  <TubeBarChart
    title="Participantes por Facultad"
    data={asignarColores(dataFacultad)}
    yLabel="Participantes"
    height={300}
    xRotate={-45}
    performanceMode="low"
  />

  <!-- 3. Participantes por Institución -->
  <TubeBarChart
    title="Participantes por Institución"
    data={asignarColores(dataInstitucion)}
    yLabel="Participantes"
    height={300}
    xRotate={-45}
    performanceMode="low"
  />

  <!-- 4. Participantes por Tipo -->
  <DonutChart
    title="Participantes por Tipo"
    data={dataTipo}
    width={300}
    height={300}
  />

  <!-- 5. Participantes por Rol -->
  <DonutChart
    title="Participantes por Rol"
    data={dataRol}
    width={300}
    height={300}
  />

  <!-- 6. Participantes por País -->
  <TubeBarChart
    title="Participantes por País"
    data={asignarColores(dataPais)}
    yLabel="Participantes"
    height={300}
    performanceMode="low"
  />

  <!-- 7. Participantes por Género -->
  <DonutChart
    title="Participantes por Género"
    data={dataGenero}
    width={300}
    height={300}
  />

  <!-- 8. Top 10 Facultades -->
  <TubeBarChart
    title="Top 10 Facultades con más participantes"
    data={asignarColores(dataTopFacultades)}
    yLabel="Participantes"
    height={350}
    performanceMode="low"
  />

  <!-- 9. Top 10 Instituciones -->
  <TubeBarChart
    title="Top 10 Instituciones con más participantes"
    data={asignarColores(dataTopInstituciones)}
    yLabel="Participantes"
    height={350}
    performanceMode="low"
  />
</div>

<style lang="scss">
  .dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
  }
</style>

