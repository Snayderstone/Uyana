<script lang="ts">
	export let topThree: Array<{
		name: string;
		value: number;
		subtitle?: string;
		avatar?: string;
	}> = [];
	export let unit: string = 'proyectos';
	export let showAvatars: boolean = false;

	// Reordenar para mostrar: 2°, 1°, 3° (estilo podio)
	$: orderedPodium =
		topThree.length >= 3
			? [topThree[1], topThree[0], topThree[2]]
			: topThree.length === 2
			? [topThree[1], topThree[0]]
			: topThree;

	function getPositionClass(index: number): string {
		if (topThree.length >= 3) {
			return ['second', 'first', 'third'][index];
		}
		return ['first', 'second'][index];
	}

	function getRealPosition(index: number): number {
		if (topThree.length >= 3) {
			return [2, 1, 3][index];
		}
		return [1, 2][index];
	}

	function getMedalEmoji(position: number): string {
		const medals = ['🥇', '🥈', '🥉'];
		return medals[position - 1] || '🏅';
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<div class="podium-container">
	{#if topThree.length === 0}
		<div class="empty-podium">
			<p>No hay datos para el podio</p>
		</div>
	{:else}
		<div class="podium-wrapper">
			{#each orderedPodium as person, index (person.name)}
				{@const position = getRealPosition(index)}
				{@const positionClass = getPositionClass(index)}

				<div class="podium-item {positionClass}">
					<!-- Avatar or Medal -->
					<div class="podium-avatar">
						{#if showAvatars && person.avatar}
							<img src={person.avatar} alt={person.name} class="avatar-image" />
						{:else if showAvatars}
							<div class="avatar-placeholder">{getInitials(person.name)}</div>
						{:else}
							<div class="medal">{getMedalEmoji(position)}</div>
						{/if}
						<div class="position-badge">#{position}</div>
					</div>

					<!-- Info -->
					<div class="podium-info">
						<h3 class="podium-name" title={person.name}>{person.name}</h3>
						{#if person.subtitle}
							<p class="podium-subtitle">{person.subtitle}</p>
						{/if}
						<div class="podium-value">
							<span class="value-number">{person.value}</span>
							<span class="value-unit">{unit}</span>
						</div>
					</div>

					<!-- Pedestal -->
					<div class="pedestal">
						<div class="pedestal-top" />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.podium-container {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		padding: 2rem 1rem;
		min-height: 350px;
		width: 100%;
	}

	.empty-podium {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--color--text-shade);
		font-size: 0.95rem;
	}

	.podium-wrapper {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 1rem;
		width: 100%;
		max-width: 700px;
	}

	.podium-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		flex: 1;
		max-width: 200px;
		animation: slideUp 0.6s var(--ease-out-3) backwards;
	}

	.podium-item.first {
		animation-delay: 0.1s;
	}

	.podium-item.second {
		animation-delay: 0.2s;
	}

	.podium-item.third {
		animation-delay: 0.3s;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.podium-avatar {
		position: relative;
		margin-bottom: 0.5rem;
	}

	.medal {
		font-size: 3rem;
		line-height: 1;
		animation: bounce 1s ease infinite;
	}

	.first .medal {
		font-size: 3.5rem;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}

	.avatar-image,
	.avatar-placeholder {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--color--primary);
	}

	.first .avatar-image,
	.first .avatar-placeholder {
		width: 96px;
		height: 96px;
		border-width: 4px;
	}

	.avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color--primary), var(--color--primary-shade));
		color: white;
		font-size: 1.5rem;
		font-weight: 700;
		font-family: var(--font--default);
	}

	.position-badge {
		position: absolute;
		bottom: -5px;
		right: -5px;
		background: var(--color--primary);
		color: white;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		font-family: var(--font--default);
		border: 2px solid var(--color--card-background, #fff);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.podium-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		width: 100%;
	}

	.podium-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.first .podium-name {
		font-size: 1.125rem;
		font-weight: 700;
	}

	.podium-subtitle {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
		font-family: var(--font--default);
	}

	.podium-value {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.5rem 1rem;
		background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.1);
		border-radius: 8px;
		margin-top: 0.25rem;
	}

	.value-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--primary);
		font-family: var(--font--default);
		line-height: 1;
	}

	.first .value-number {
		font-size: 1.75rem;
	}

	.value-unit {
		font-size: 0.7rem;
		color: var(--color--text-shade);
		font-family: var(--font--default);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.pedestal {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.pedestal-top {
		width: 100%;
		background: linear-gradient(
			to bottom,
			rgba(var(--color--primary-rgb, 110, 41, 231), 0.2),
			rgba(var(--color--primary-rgb, 110, 41, 231), 0.05)
		);
		border: 2px solid rgba(var(--color--primary-rgb, 110, 41, 231), 0.3);
		border-radius: 8px 8px 0 0;
		transition: all 0.3s var(--ease-out-3);
	}

	.first .pedestal-top {
		height: 120px;
		background: linear-gradient(to bottom, #ffd700, #ffed4e);
		border-color: #ffd700;
	}

	.second .pedestal-top {
		height: 90px;
		background: linear-gradient(to bottom, #c0c0c0, #e8e8e8);
		border-color: #c0c0c0;
	}

	.third .pedestal-top {
		height: 60px;
		background: linear-gradient(to bottom, #cd7f32, #e8a87c);
		border-color: #cd7f32;
	}

	.podium-item:hover .pedestal-top {
		transform: translateY(-5px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 768px) {
		.podium-wrapper {
			gap: 0.5rem;
		}

		.podium-name {
			font-size: 0.875rem;
		}

		.first .podium-name {
			font-size: 1rem;
		}

		.medal {
			font-size: 2.5rem;
		}

		.first .medal {
			font-size: 3rem;
		}

		.avatar-image,
		.avatar-placeholder {
			width: 60px;
			height: 60px;
		}

		.first .avatar-image,
		.first .avatar-placeholder {
			width: 72px;
			height: 72px;
		}

		.value-number {
			font-size: 1.25rem;
		}

		.first .value-number {
			font-size: 1.5rem;
		}

		.first .pedestal-top {
			height: 100px;
		}

		.second .pedestal-top {
			height: 75px;
		}

		.third .pedestal-top {
			height: 50px;
		}
	}
</style>
