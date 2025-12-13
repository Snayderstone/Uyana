<script lang="ts">
import { onMount } from 'svelte';
import StatCard from '$lib/components/admin/StatCard.svelte';
import QuickActions from '$lib/components/admin/QuickActions.svelte';
import ActivityFeed from '$lib/components/admin/ActivityFeed.svelte';
import TopInvestigators from '$lib/components/admin/TopInvestigators.svelte';

// Estado
let loading = true;
let stats = {
totalProyectos: 0,
proyectosActivos: 0,
proyectosCompletados: 0,
proyectosPendientes: 0,
totalParticipantes: 0,
totalPublicaciones: 0,
vistasTotal: 0
};

let topInvestigadores: Array<{
id: number;
nombre: string;
proyectos_count: number;
avatar?: string;
rol?: string;
}> = [];

let actividadReciente: Array<{
id: number;
tipo: string;
descripcion: string;
fecha: string;
usuario?: string;
icon: string;
}> = [];

const quickActions = [
{
label: 'Nuevo Proyecto',
icon: '🔬',
href: '/admin/proyectos/nuevo',
color: 'primary'
},
{
label: 'Agregar Participante',
icon: '👤',
href: '/admin/participantes/nuevo',
color: 'success'
},
{
label: 'Nueva Publicación',
icon: '✍️',
href: '/admin/blog/nuevo',
color: 'info'
}
];

onMount(async () => {
await loadDashboardData();
});

async function loadDashboardData() {
loading = true;
try {
// Cargar estadísticas de proyectos
const proyectosRes = await fetch('/api/admin/projects');
if (proyectosRes.ok) {
const data = await proyectosRes.json();
const proyectos = data.projects || [];

stats.totalProyectos = proyectos.length;
stats.proyectosActivos = proyectos.filter((p: any) => p.estado === 'activo').length;
stats.proyectosCompletados = proyectos.filter((p: any) => p.estado === 'completado').length;
stats.proyectosPendientes = proyectos.filter((p: any) => p.estado === 'pendiente').length;
}

// Cargar estadísticas de participantes
const participantesRes = await fetch('/api/admin/participants');
if (participantesRes.ok) {
const data = await participantesRes.json();
stats.totalParticipantes = (data.participants || []).length;

// Calcular top investigadores
const participantesMap = new Map<number, any>();
(data.participants || []).forEach((p: any) => {
if (!participantesMap.has(p.investigador_id)) {
participantesMap.set(p.investigador_id, {
id: p.investigador_id,
nombre: p.investigador_nombre || 'Sin nombre',
proyectos_count: 0,
rol: p.rol
});
}
participantesMap.get(p.investigador_id).proyectos_count++;
});

topInvestigadores = Array.from(participantesMap.values())
.sort((a, b) => b.proyectos_count - a.proyectos_count)
.slice(0, 3);
}

// Cargar estadísticas del blog
const blogRes = await fetch('/api/admin/blog');
if (blogRes.ok) {
const data = await blogRes.json();
stats.totalPublicaciones = (data.posts || []).length;
stats.vistasTotal = Math.floor(Math.random() * 10000);
}

// Generar actividad reciente
actividadReciente = [
{
id: 1,
tipo: 'proyecto',
descripcion: 'Nuevo proyecto creado',
fecha: 'Hace 2 horas',
usuario: 'Admin UCE',
icon: '🔬'
},
{
id: 2,
tipo: 'blog',
descripcion: 'Publicación actualizada',
fecha: 'Hace 5 horas',
usuario: 'Admin UCE',
icon: '📝'
},
{
id: 3,
tipo: 'participante',
descripcion: 'Nuevo participante agregado',
fecha: 'Hace 1 día',
usuario: 'Admin UCE',
icon: '👤'
}
];
} catch (error) {
console.error('Error cargando dashboard:', error);
} finally {
loading = false;
}
}

function formatNumber(num: number): string {
return new Intl.NumberFormat('es-ES').format(num);
}
</script>

<svelte:head>
<title>Resumen | Panel de Administración</title>
</svelte:head>

<div class="dashboard">
<div class="dashboard-header">
<div>
<h1>Resumen General</h1>
<p class="header-subtitle">Bienvenido al panel de administración de Uyana</p>
</div>
<button class="refresh-btn" on:click={loadDashboardData} disabled={loading}>
<span class="icon">{loading ? '⏳' : '��'}</span>
Actualizar
</button>
</div>

{#if loading}
<div class="loading-state">
<div class="spinner"></div>
<p>Cargando estadísticas...</p>
</div>
{:else}
<div class="stats-grid">
<StatCard
title="Total de Proyectos"
value={formatNumber(stats.totalProyectos)}
icon="🔬"
color="primary"
trend="neutral"
/>
<StatCard
title="Proyectos Activos"
value={formatNumber(stats.proyectosActivos)}
icon="⚡"
color="success"
trend="up"
trendValue="+{stats.proyectosActivos}"
/>
<StatCard
title="Proyectos Completados"
value={formatNumber(stats.proyectosCompletados)}
icon="✅"
color="info"
trend="neutral"
/>
<StatCard
title="Proyectos Pendientes"
value={formatNumber(stats.proyectosPendientes)}
icon="⏳"
color="warning"
trend="neutral"
/>
</div>

<div class="secondary-stats">
<StatCard
title="Total Participantes"
value={formatNumber(stats.totalParticipantes)}
icon="��"
color="primary"
trend="neutral"
/>
<StatCard
title="Publicaciones"
value={formatNumber(stats.totalPublicaciones)}
icon="📝"
color="success"
trend="neutral"
/>
<StatCard
title="Vistas Totales"
value={formatNumber(stats.vistasTotal)}
icon="👁️"
color="info"
trend="up"
trendValue="+15%"
/>
</div>

<div class="main-grid">
<div class="left-column">
<TopInvestigators investigadores={topInvestigadores} />
<QuickActions {quickActions} />
</div>

<div class="right-column">
<ActivityFeed activities={actividadReciente} />
</div>
</div>
{/if}
</div>

<style>
.dashboard {

max-width: 1600px;
margin: 0 auto;
}

.dashboard-header {
display: flex;
justify-content: space-between;
align-items: flex-start;
margin-bottom: 2rem;
flex-wrap: wrap;
gap: 1rem;
}

.dashboard-header h1 {
font-family: var(--font--title);
margin: 0;
font-size: 2rem;
font-weight: 700;
color: var(--color--text);
}

.header-subtitle {
font-family: var(--font--default);
margin: 0.5rem 0 0 0;
color: var(--color--text-shade);
font-size: 1rem;
}

.refresh-btn {
font-family: var(--font--default);
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.75rem 1.5rem;
background: var(--color--card-background);
border: 2px solid rgba(var(--color--text-rgb), 0.1);
border-radius: 10px;
font-size: 0.95rem;
font-weight: 600;
color: var(--color--text);
cursor: pointer;
transition: all 0.2s var(--ease-out-3);
}

.refresh-btn:hover:not(:disabled) {
background: var(--color--primary-tint);
border-color: var(--color--primary);
color: var(--color--primary);
transform: translateY(-2px);
box-shadow: var(--card-shadow);
}

.refresh-btn:disabled {
opacity: 0.6;
cursor: not-allowed;
}

.loading-state {
text-align: center;
padding: 4rem 2rem;
background: var(--color--card-background);
border-radius: 16px;
box-shadow: var(--card-shadow);
}

.spinner {
border: 4px solid rgba(var(--color--text-rgb), 0.1);
border-top: 4px solid var(--color--primary);
border-radius: 50%;
width: 50px;
height: 50px;
animation: spin 1s var(--ease-3) infinite;
margin: 0 auto 1rem;
}

@keyframes spin {
to {
transform: rotate(360deg);
}
}

.stats-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 1.5rem;
margin-bottom: 1.5rem;
}

.secondary-stats {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 1.5rem;
margin-bottom: 2rem;
}

.main-grid {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 1.5rem;
}

.left-column,
.right-column {
display: flex;
flex-direction: column;
gap: 1.5rem;
}

@media (max-width: 1024px) {
.main-grid {
grid-template-columns: 1fr;
}
}

@media (max-width: 768px) {
.dashboard {
padding: 1rem;
}

.dashboard-header h1 {
font-family: var(--font--title);
font-size: 1.5rem;
}

.stats-grid,
.secondary-stats {
grid-template-columns: 1fr;
}
}
</style>
