<script lang="ts">
export let title: string = 'Top Investigadores';
export let investigadores: Array<{
id: number;
nombre: string;
proyectos_count: number;
avatar?: string;
rol?: string;
}> = [];
</script>

<div class="top-investigators">
<h3 class="section-title">{title}</h3>
{#if investigadores.length === 0}
<div class="empty-state">
<p>No hay investigadores destacados</p>
</div>
{:else}
<div class="investigators-list">
{#each investigadores as investigador, index}
<div class="investigator-item rank-{index + 1}">
<div class="rank-badge">
{#if index === 0}🥇{:else if index === 1}🥈{:else}🥉{/if}
</div>
<div class="investigator-avatar">
{#if investigador.avatar}
<img src={investigador.avatar} alt={investigador.nombre} />
{:else}
<div class="avatar-placeholder">
{investigador.nombre.charAt(0).toUpperCase()}
</div>
{/if}
</div>
<div class="investigator-info">
<div class="investigator-name">{investigador.nombre}</div>
{#if investigador.rol}
<div class="investigator-rol">{investigador.rol}</div>
{/if}
<div class="investigator-stats">
{investigador.proyectos_count} {investigador.proyectos_count === 1 ? 'proyecto' : 'proyectos'}
</div>
</div>
</div>
{/each}
</div>
{/if}
</div>

<style>
.top-investigators {
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

.investigators-list {
display: flex;
flex-direction: column;
gap: 1rem;
}

.investigator-item {
display: flex;
align-items: center;
gap: 1rem;
padding: 1rem;
background: rgba(var(--color--primary-rgb), 0.03);
border-radius: 12px;
border-left: 4px solid transparent;
transition: all 0.3s var(--ease-out-3);
}

.investigator-item:hover {
background: rgba(var(--color--primary-rgb), 0.06);
transform: translateX(4px);
}

.investigator-item.rank-1 {
border-left-color: #fbbf24;
background: linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%);
}

.investigator-item.rank-2 {
border-left-color: #94a3b8;
background: linear-gradient(90deg, rgba(148, 163, 184, 0.1) 0%, transparent 100%);
}

.investigator-item.rank-3 {
border-left-color: #fb923c;
background: linear-gradient(90deg, rgba(251, 146, 60, 0.1) 0%, transparent 100%);
}

.rank-badge {
font-size: 1.5rem;
flex-shrink: 0;
}

.investigator-avatar {
width: 48px;
height: 48px;
border-radius: 50%;
overflow: hidden;
flex-shrink: 0;
box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.2);
}

.investigator-avatar img {
width: 100%;
height: 100%;
object-fit: cover;
}

.avatar-placeholder {
width: 100%;
height: 100%;
display: flex;
align-items: center;
justify-content: center;
background: linear-gradient(135deg, var(--color--primary) 0%, var(--color--primary-shade) 100%);
color: var(--color--text-inverse);
font-family: var(--font--title);
font-size: 1.25rem;
font-weight: 700;
}

.investigator-info {
flex: 1;
min-width: 0;
}

.investigator-name {
font-size: 1rem;
font-family: var(--font--title);
font-weight: 600;
color: var(--color--text);
margin-bottom: 0.25rem;
}

.investigator-rol {
font-size: 0.875rem;
font-family: var(--font--default);
color: var(--color--text-shade);
margin-bottom: 0.25rem;
}

.investigator-stats {
font-size: 0.875rem;
font-family: var(--font--default);
color: var(--color--primary);
font-weight: 600;
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
