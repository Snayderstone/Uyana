<script lang="ts">
	import type { Investigador } from '$lib/supabase';

	export let investigadores: Investigador[] = [];

	// Calculate faculty statistics
	$: facultyStats = calculateFacultyStats(investigadores);

	// Function to calculate faculty stats
	function calculateFacultyStats(investigators: Investigador[]) {
		const stats: Record<string, number> = {};

		// Count researchers by faculty
		investigators.forEach((inv) => {
			const faculty = inv.facultad || 'Sin facultad';
			if (!stats[faculty]) {
				stats[faculty] = 0;
			}
			stats[faculty]++;
		});

		// Convert to array for chart and sort by count (descending)
		return Object.entries(stats)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);
	}
</script>

<section class="chart-container">
	<div class="chart-wrapper">
		<div class="bars-container">
			{#each facultyStats as { name, count }, i}
				{@const percentage = Math.round((count / investigadores.length) * 100)}
				{@const hue = 250 - ((i * 15) % 360)}
				<!-- Purple to blue gradient -->
				<div class="bar-item">
					<div class="bar-label">
						<span class="faculty-name" title={name}>
							{name.length > 30 ? name.slice(0, 30) + '...' : name}
						</span>
						<span class="count">{count}</span>
					</div>
					<div class="bar-container">
						<div
							class="bar"
							style="width: {percentage}%; background-color: hsl({hue}, 70%, 60%);"
							title="{percentage}% - {count} investigadores en {name}"
						>
							<span class="percentage">{percentage}%</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';
	@import '$lib/scss/_mixins.scss';

	.chart-container {
		width: 100%;
		padding: 10px;
		overflow: hidden;
	}

	.chart-wrapper {
		animation: fadeIn 0.5s ease-in-out;
	}

	.bars-container {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.bar-item {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.bar-label {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;

		.faculty-name {
			font-weight: 600;
			color: var(--color--text);
		}

		.count {
			font-weight: 700;
			color: var(--color--primary);
		}
	}

	.bar-container {
		height: 25px;
		background-color: rgba(var(--color--primary-rgb), 0.1);
		border-radius: 5px;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		display: flex;
		align-items: center;
		padding: 0 10px;
		color: white;
		font-weight: 600;
		font-size: 0.8rem;
		border-radius: 5px;
		transition: width 1s ease-in-out;
		min-width: 40px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

		.percentage {
			@include for-phone-only {
				display: none;
			}
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
