<script lang="ts">
export let title: string = 'Acciones Rápidas';
export let actions: Array<{
label: string;
icon: string;
href: string;
color: string;
}> = [];
</script>

<div class="quick-actions">
<h3 class="section-title">{title}</h3>
<div class="actions-grid">
{#each actions as action}
<a href={action.href} class="action-btn {action.color}">
<span class="action-icon">{action.icon}</span>
<span class="action-label">{action.label}</span>
</a>
{/each}
</div>
</div>

<style>
.quick-actions {
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

.actions-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
gap: 1rem;
}

.action-btn {
display: flex;
flex-direction: column;
align-items: center;
gap: 0.75rem;
padding: 1.25rem;
border-radius: 12px;
text-decoration: none;
transition: all 0.3s var(--ease-out-3);
border: 2px solid transparent;
font-family: var(--font--default);
}

.action-btn.primary {
background: linear-gradient(135deg, var(--color--primary-tint) 0%, var(--color--primary-tint) 100%);
color: var(--color--primary);
}

.action-btn.success {
background: linear-gradient(135deg, var(--color--callout-background--success) 0%, var(--color--callout-background--success) 100%);
color: var(--color--callout-accent--success);
}

.action-btn.info {
background: linear-gradient(135deg, var(--color--callout-background--info) 0%, var(--color--callout-background--info) 100%);
color: var(--color--callout-accent--info);
}

.action-btn.warning {
background: linear-gradient(135deg, var(--color--callout-background--warning) 0%, var(--color--callout-background--warning) 100%);
color: var(--color--callout-accent--warning);
}

.action-btn.secondary {
background: linear-gradient(135deg, var(--color--secondary-tint) 0%, var(--color--secondary-tint) 100%);
color: var(--color--secondary);
}

.action-btn:hover {
transform: translateY(-4px);
box-shadow: var(--card-shadow-hover);
border-color: currentColor;
}

.action-icon {
font-size: 2rem;
}

.action-label {
font-size: 0.875rem;
font-weight: 600;
text-align: center;
}

@media (max-width: 640px) {
.actions-grid {
grid-template-columns: 1fr;
}
}
</style>
