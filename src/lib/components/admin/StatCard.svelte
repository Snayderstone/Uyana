<script lang="ts">
export let title: string;
export let value: string | number;
export let icon: string;
export let trend: 'up' | 'down' | 'neutral' = 'neutral';
export let trendValue: string = '';
export let color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' = 'primary';
</script>

<div class="stat-card {color}">
<div class="stat-header">
<div class="stat-icon">
<span>{icon}</span>
</div>
<div class="stat-trend" class:up={trend === 'up'} class:down={trend === 'down'}>
{#if trend === 'up'}
<span class="trend-icon">📈</span>
{:else if trend === 'down'}
<span class="trend-icon">📉</span>
{/if}
{#if trendValue}
<span class="trend-value">{trendValue}</span>
{/if}
</div>
</div>

<div class="stat-body">
<div class="stat-value">{value}</div>
<div class="stat-title">{title}</div>
</div>
</div>

<style>
.stat-card {
background: var(--color--card-background);
border-radius: 16px;
padding: 1.5rem;
box-shadow: var(--card-shadow);
transition: all 0.3s var(--ease-out-3);
border: 2px solid transparent;
position: relative;
overflow: hidden;
}

.stat-card::before {
content: '';
position: absolute;
top: 0;
left: 0;
right: 0;
height: 4px;
background: linear-gradient(90deg, var(--card-color), var(--card-color-dark));
}

.stat-card:hover {
transform: translateY(-4px);
box-shadow: var(--card-shadow-hover);
border-color: var(--card-color);
}

/* Color variants usando el sistema de diseño */
.stat-card.primary {
--card-color: var(--color--primary);
--card-color-dark: var(--color--primary-shade);
}

.stat-card.secondary {
--card-color: var(--color--secondary);
--card-color-dark: var(--color--secondary-shade);
}

.stat-card.success {
--card-color: #10b981;
--card-color-dark: #059669;
}

.stat-card.warning {
--card-color: var(--color--yellow);
--card-color-dark: #d97706;
}

.stat-card.info {
--card-color: #3b82f6;
--card-color-dark: #2563eb;
}

.stat-header {
display: flex;
justify-content: space-between;
align-items: flex-start;
margin-bottom: 1rem;
}

.stat-icon {
width: 50px;
height: 50px;
border-radius: 12px;
background: linear-gradient(135deg, var(--card-color), var(--card-color-dark));
display: flex;
align-items: center;
justify-content: center;
font-size: 1.5rem;
box-shadow: 0 4px 12px rgba(var(--color--primary-rgb), 0.2);
}

.stat-trend {
display: flex;
align-items: center;
gap: 0.25rem;
font-size: 0.875rem;
font-family: var(--font--default);
font-weight: 500;
padding: 0.25rem 0.5rem;
border-radius: 6px;
}

.stat-trend.up {
background: var(--color--callout-background--success);
color: var(--color--callout-accent--success);
}

.stat-trend.down {
background: var(--color--callout-background--error);
color: var(--color--callout-accent--error);
}

.trend-icon {
font-size: 1rem;
}

.stat-body {
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.stat-value {
font-size: 2rem;
font-family: var(--font--title);
font-weight: 700;
color: var(--color--text);
line-height: 1;
}

.stat-title {
font-size: 0.95rem;
font-family: var(--font--default);
color: var(--color--text-shade);
font-weight: 500;
}

@media (max-width: 768px) {
.stat-card {
padding: 1.25rem;
}

.stat-value {
font-size: 1.75rem;
}

.stat-icon {
width: 45px;
height: 45px;
font-size: 1.25rem;
}
}
</style>
