<script lang="ts">
export let title: string = 'Actividad Reciente';
export let activities: Array<{
id: number;
tipo: string;
descripcion: string;
fecha: string;
usuario?: string;
icon: string;
}> = [];
</script>

<div class="activity-feed">
<h3 class="section-title">{title}</h3>
{#if activities.length === 0}
<div class="empty-state">
<p>No hay actividad reciente</p>
</div>
{:else}
<div class="activities-list">
{#each activities as activity}
<div class="activity-item">
<div class="activity-icon">{activity.icon}</div>
<div class="activity-content">
<p class="activity-description">{activity.descripcion}</p>
<div class="activity-meta">
{#if activity.usuario}
<span class="activity-user">{activity.usuario}</span>
<span class="separator">•</span>
{/if}
<span class="activity-time">{activity.fecha}</span>
</div>
</div>
</div>
{/each}
</div>
{/if}
</div>

<style>
.activity-feed {
background: var(--color--card-background);
border-radius: 16px;
padding: 1.5rem;
box-shadow: var(--card-shadow);
}

.section-title {
margin: 0 0 1.25rem 0;
font-size: 1.125rem;
font-family: var(--font--title);
font-weight: 600;
color: var(--color--text);
}

.activities-list {
display: flex;
flex-direction: column;
gap: 1rem;
max-height: 500px;
overflow-y: auto;
}

.activities-list::-webkit-scrollbar {
width: 6px;
}

.activities-list::-webkit-scrollbar-track {
background: rgba(var(--color--text-rgb), 0.05);
border-radius: 3px;
}

.activities-list::-webkit-scrollbar-thumb {
background: rgba(var(--color--text-rgb), 0.2);
border-radius: 3px;
}

.activities-list::-webkit-scrollbar-thumb:hover {
background: rgba(var(--color--text-rgb), 0.3);
}

.activity-item {
display: flex;
gap: 1rem;
padding: 1rem;
background: rgba(var(--color--primary-rgb), 0.03);
border-radius: 10px;
transition: all 0.2s var(--ease-out-3);
}

.activity-item:hover {
background: rgba(var(--color--primary-rgb), 0.06);
transform: translateX(4px);
}

.activity-icon {
font-size: 1.5rem;
flex-shrink: 0;
}

.activity-content {
flex: 1;
min-width: 0;
}

.activity-description {
margin: 0 0 0.25rem 0;
font-size: 0.95rem;
font-family: var(--font--default);
font-weight: 500;
color: var(--color--text);
}

.activity-meta {
display: flex;
align-items: center;
gap: 0.5rem;
font-size: 0.875rem;
font-family: var(--font--default);
color: var(--color--text-shade);
}

.activity-user {
font-weight: 500;
}

.separator {
opacity: 0.5;
}

.empty-state {
padding: 3rem 1rem;
text-align: center;
}

.empty-state p {
margin: 0;
color: var(--color--text-shade);
font-family: var(--font--default);
font-size: 0.95rem;
}
</style>
