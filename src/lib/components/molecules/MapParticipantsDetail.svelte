<!-- src/lib/components/molecules/MapParticipantsDetail.svelte -->
<script lang="ts">
  import type { MapLevel } from '$lib/models/map.model';
  import type { MapParticipantForUI } from '$lib/models/map-participants.model';
  import { fly } from 'svelte/transition';

  export let participants: MapParticipantForUI[] = [];
  export let isVisible: boolean = false;
  export let selectedRegionName: string | null = null;
  export let mapLevel: MapLevel = 'faculty';

  // Paginación
  let itemsPerPage = 8;
  let currentPage = 1;

  // --------------------------------
  // Normalización igual que el mapa
  // --------------------------------
  function normalizarNombreFacultad(nombre: string): string {
    if (!nombre) return 'No especificada';

    let s = nombre.trim().toLowerCase();
    s = s.replace(/^facultad\s+de\s+/, '');
    s = s.replace(/^facultad\s+/, '');
    s = s.replace(/\s+/g, ' ');

    const title = s
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return `Facultad De ${title}`;
  }

  function getEntityKey(level: MapLevel, rawName?: string | null): string {
    if (!rawName) return 'No especificado';
    const trimmed = rawName.trim();
    if (level === 'faculty') return normalizarNombreFacultad(trimmed);
    return trimmed;
  }

  // Helpers para leer campos flexibles del participante
  function getFacultyFromParticipant(p: MapParticipantForUI): string | null {
    const anyP = p as any;
    return (
      anyP.facultyName ||
      anyP.facultad ||
      anyP.facultadNombre ||
      anyP.facultad_o_entidad_o_area_responsable ||
      null
    );
  }

  function getInstitutionsFromParticipant(p: MapParticipantForUI): string[] {
    const anyP = p as any;
    const main =
      anyP.institutionName ||
      anyP.institucion ||
      anyP.institucionPrincipal ||
      null;

    const related =
      anyP.institutionsRelated ||
      anyP.instituciones_relacionadas ||
      [];

    const arr: string[] = [];
    if (main) arr.push(main);
    if (Array.isArray(related)) {
      for (const r of related) {
        if (r) arr.push(r);
      }
    }
    return arr;
  }

  function getParticipantName(p: MapParticipantForUI): string {
    const anyP = p as any;
    return (
      anyP.fullName ||
      anyP.nombreCompleto ||
      anyP.nombre ||
      `${anyP.apellidos ?? ''} ${anyP.nombres ?? ''}`.trim() ||
      'Participante sin nombre'
    );
  }

  function getParticipantType(p: MapParticipantForUI): string {
    const anyP = p as any;
    return (
      anyP.participantType ||
      anyP.tipoParticipante ||
      anyP.tipo ||
      anyP.rol ||
      'Participante'
    );
  }

  function getParticipantRole(p: MapParticipantForUI): string | null {
    const anyP = p as any;
    return anyP.rol || anyP.rolEnProyecto || anyP.rol_en_proyecto || null;
  }

  function getParticipantEmail(p: MapParticipantForUI): string | null {
    const anyP = p as any;
    return anyP.email || anyP.correo || null;
  }

  function getParticipantProjectOrEvent(p: MapParticipantForUI): string | null {
    const anyP = p as any;
    return (
      anyP.projectTitle ||
      anyP.proyectoTitulo ||
      anyP.proyecto ||
      anyP.evento ||
      null
    );
  }

  function getParticipantLocation(p: MapParticipantForUI): { city?: string; country?: string } {
    const anyP = p as any;
    return {
      city: anyP.city || anyP.ciudad || undefined,
      country: anyP.country || anyP.pais || undefined
    };
  }

  function getFacultyLabel(p: MapParticipantForUI): string | null {
    return getFacultyFromParticipant(p);
  }

  function getInstitutionLabel(p: MapParticipantForUI): string | null {
    const insts = getInstitutionsFromParticipant(p);
    if (!insts.length) return null;
    return insts[0];
  }
  function getParticipantKey(p: MapParticipantForUI): string {
    const anyP = p as any;
    return anyP.id ?? anyP.email ?? getParticipantName(p);
  }
  // Badge por tipo de participante
  function getTypeColor(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('docente') || t.includes('profesor')) return 'primary';
    if (t.includes('estudiante') || t.includes('alumno')) return 'success';
    if (t.includes('administrativo') || t.includes('técnico')) return 'muted';
    return 'secondary';
  }

  // --------------------------------
  // Filtrado por región seleccionada
  // --------------------------------
  $: selectedKey =
    selectedRegionName && selectedRegionName.trim()
      ? getEntityKey(mapLevel, selectedRegionName)
      : null;

  $: filteredParticipants = (() => {
    if (!selectedKey) return participants;

    return participants.filter((p) => {
      if (mapLevel === 'faculty') {
        const faculty = getFacultyFromParticipant(p);
        if (!faculty) return false;
        return getEntityKey('faculty', faculty) === selectedKey;
      }

      // institution
      const insts = getInstitutionsFromParticipant(p);
      if (!insts.length) return false;
      return insts.some(
        (name) => getEntityKey('institution', name) === selectedKey
      );
    });
  })();

  // Paginación
  $: paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: totalPages = Math.ceil(filteredParticipants.length / itemsPerPage) || 1;

  $: if (currentPage > totalPages) {
    currentPage = 1;
  }

  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
</script>

{#if isVisible && filteredParticipants.length > 0}
  <div class="participants-detail" in:fly={{ y: 20, duration: 300 }}>
    <div class="participants-header">
      <h2>
        {#if selectedRegionName}
          Participantes en {selectedRegionName}
        {:else}
          Participantes encontrados
        {/if}
        <span class="count-badge">{filteredParticipants.length}</span>
      </h2>
    </div>

        <div class="participants-list">
      {#each paginatedParticipants as participant (getParticipantKey(participant))}
        <div class="participant-card" in:fly={{ y: 10, duration: 200, delay: 100 }}>
          <div class="participant-header">
            <div class="participant-main">
              <div class="participant-name">{getParticipantName(participant)}</div>

              {#if getParticipantProjectOrEvent(participant)}
                <div class="participant-project">
                  {getParticipantProjectOrEvent(participant)}
                </div>
              {/if}
            </div>

            <div class="participant-type">
              {#if getParticipantType(participant)}
                <div class="badge badge-{getTypeColor(getParticipantType(participant))}">
                  {getParticipantType(participant)}
                </div>
              {/if}
            </div>
          </div>

          <div class="participant-content">
            <div class="participant-details">
              {#if getFacultyLabel(participant)}
                <div class="detail-row">
                  <span class="detail-label">Facultad:</span>
                  <span class="detail-value">
                    {getFacultyLabel(participant)}
                  </span>
                </div>
              {/if}

              {#if getInstitutionLabel(participant)}
                <div class="detail-row">
                  <span class="detail-label">Institución:</span>
                  <span class="detail-value">
                    {getInstitutionLabel(participant)}
                  </span>
                </div>
              {/if}

              {#if getParticipantRole(participant)}
                <div class="detail-row">
                  <span class="detail-label">Rol:</span>
                  <span class="detail-value">
                    {getParticipantRole(participant)}
                  </span>
                </div>
              {/if}

              {#if getParticipantEmail(participant)}
                <div class="detail-row">
                  <span class="detail-label">Correo:</span>
                  <span class="detail-value email">
                    {getParticipantEmail(participant)}
                  </span>
                </div>
              {/if}

              {#if getParticipantLocation(participant).city || getParticipantLocation(participant).country}
                <div class="detail-row">
                  <span class="detail-label">Ubicación:</span>
                  <span class="detail-value">
                    {#if getParticipantLocation(participant).city}
                      {getParticipantLocation(participant).city}
                    {/if}
                    {#if getParticipantLocation(participant).city && getParticipantLocation(participant).country}
                      ,{' '}
                    {/if}
                    {#if getParticipantLocation(participant).country}
                      {getParticipantLocation(participant).country}
                    {/if}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>


    {#if totalPages > 1}
      <div class="pagination">
        <button class="pagination-btn" disabled={currentPage === 1} on:click={prevPage}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Anterior
        </button>

        <div class="pagination-info">
          Página {currentPage} de {totalPages}
        </div>

        <button class="pagination-btn" disabled={currentPage === totalPages} on:click={nextPage}>
          Siguiente
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
{:else if isVisible}
  <div class="participants-detail no-results" in:fly={{ y: 20, duration: 300 }}>
    <div class="no-results-message">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
      <h3>No se encontraron participantes</h3>
      <p>Intente con diferentes criterios de búsqueda o filtros.</p>
    </div>
  </div>
{/if}

<style lang="scss">
  @import '$lib/scss/_breakpoints.scss';

  .participants-detail {
    width: 100%;
    background: var(--color--card-background);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--card-shadow);
    color: var(--color--text);
    margin-top: 20px;

    &.no-results {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }
  }

  .participants-header {
    margin-bottom: 20px;

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color--text);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;

      @include for-phone-only {
        font-size: 1.3rem;
      }
    }
  }

  .count-badge {
    background: var(--color--primary);
    color: white;
    font-size: 0.9rem;
    padding: 3px 10px;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .participants-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .participant-card {
    border: 1px solid color-mix(in srgb, var(--color--text) 15%, transparent);
    border-radius: 10px;
    padding: 15px;
    background: color-mix(in srgb, var(--color--card-background) 70%, transparent);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
      border-color: color-mix(in srgb, var(--color--primary) 30%, transparent);
    }
  }

  .participant-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 15px;

    @include for-phone-only {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .participant-main {
    flex: 1;
  }

  .participant-name {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--color--primary);

    @include for-phone-only {
      font-size: 1rem;
    }
  }

  .participant-project {
    margin-top: 4px;
    font-size: 0.85rem;
    color: var(--color--text-shade);
  }

  .participant-type {
    display: flex;
    justify-content: flex-end;
  }

  .participant-content {
    display: flex;
    gap: 20px;

    @include for-phone-only {
      flex-direction: column;
    }
  }

  .participant-details {
    flex: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 20px;

    @include for-phone-only {
      grid-template-columns: 1fr;
    }
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .detail-label {
    font-size: 0.75rem;
    color: var(--color--text-shade);
  }

  .detail-value {
    font-size: 0.9rem;
    font-weight: 500;

    &.email {
      font-family: var(--font-mono, monospace);
      font-size: 0.85rem;
    }
  }

  .badge {
    padding: 5px 12px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.8rem;
    display: inline-block;
    text-align: center;

    &.badge-success {
      background: color-mix(in srgb, var(--color--callout-accent--success) 20%, transparent);
      color: var(--color--callout-accent--success);
    }

    &.badge-warning {
      background: color-mix(in srgb, var(--color--callout-accent--warning) 20%, transparent);
      color: var(--color--callout-accent--warning);
    }

    &.badge-error {
      background: color-mix(in srgb, var(--color--callout-accent--error) 20%, transparent);
      color: var(--color--callout-accent--error);
    }

    &.badge-primary {
      background: color-mix(in srgb, var(--color--primary) 20%, transparent);
      color: var(--color--primary);
    }

    &.badge-secondary {
      background: color-mix(in srgb, var(--color--secondary) 20%, transparent);
      color: var(--color--secondary);
    }

    &.badge-muted {
      background: color-mix(in srgb, var(--color--text) 15%, transparent);
      color: var(--color--text-shade);
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
  }

  .pagination-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: color-mix(in srgb, var(--color--primary) 15%, transparent);
    color: var(--color--primary);
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--color--primary) 25%, transparent);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .pagination-info {
    font-size: 0.9rem;
    color: var(--color--text-shade);
  }

  .no-results-message {
    text-align: center;

    svg {
      color: var(--color--text-shade);
      opacity: 0.7;
      margin-bottom: 15px;
    }

    h3 {
      margin: 0 0 10px 0;
      font-weight: 600;
      color: var(--color--text);
    }

    p {
      margin: 0;
      color: var(--color--text-shade);
    }
  }
</style>
