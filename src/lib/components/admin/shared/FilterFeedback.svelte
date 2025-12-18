<script lang="ts">
	import { icons } from './Icons';

	export let show = false;
	export let message = '';
	export let type: 'success' | 'info' | 'warning' = 'success';

	const typeColors = {
		success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
		info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
		warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
	};
</script>

{#if show}
	<div class="filter-feedback" style="background: {typeColors[type]}">
		<span class="icon">{icons.check}</span>
		{message}
	</div>
{/if}

<style lang="scss">
	.filter-feedback {
		color: white;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		animation: slideDown 0.3s ease-out;

		.icon {
			font-size: 1.25rem;
		}
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
