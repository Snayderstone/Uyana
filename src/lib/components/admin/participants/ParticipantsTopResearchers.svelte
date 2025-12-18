<script lang="ts">
	export let topParticipantes: any[] = [];
	export let getAvatarUrl: (url: string | null, name: string) => string;
	export let handleImageError: (event: Event) => void;
</script>

{#if topParticipantes && topParticipantes.length >= 3}
	<!-- Podio Top 3 -->
	<div class="podium-container">
		<!-- 2nd Place - Silver -->
		{#if topParticipantes[1]}
			{@const second = topParticipantes[1]}
			<div class="podium-place second">
				<div class="medal-container">
					<svg class="medal-svg silver" viewBox="0 0 100 100">
						<circle cx="50" cy="50" r="45" fill="#C0C0C0" />
						<circle cx="50" cy="50" r="35" fill="#E8E8E8" />
						<text x="50" y="65" text-anchor="middle" fill="#666" font-size="32" font-weight="bold"
							>2</text
						>
					</svg>
				</div>
				<div class="podium-avatar">
					<img
						src={getAvatarUrl(second.url_foto, second.participante_nombre)}
						alt={second.participante_nombre}
						on:error={handleImageError}
					/>
				</div>
				<h4 class="podium-name">{second.participante_nombre}</h4>
				<p class="podium-faculty">{second.facultad_nombre || 'Sin facultad'}</p>
				<div class="podium-stats">
					<div class="podium-stat">
						<span class="stat-value">{second.total_proyectos || 0}</span>
						<span class="stat-label">Proyectos</span>
					</div>
					<div class="podium-stat">
						<span class="stat-value">{second.proyectos_como_director || 0}</span>
						<span class="stat-label">Director</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- 1st Place - Gold -->
		{#if topParticipantes[0]}
			{@const first = topParticipantes[0]}
			<div class="podium-place first">
				<div class="medal-container">
					<svg class="medal-svg gold" viewBox="0 0 100 100">
						<circle cx="50" cy="50" r="45" fill="#FFD700" />
						<circle cx="50" cy="50" r="35" fill="#FFF4C1" />
						<text
							x="50"
							y="65"
							text-anchor="middle"
							fill="#B8860B"
							font-size="32"
							font-weight="bold">1</text
						>
					</svg>
				</div>
				<div class="podium-avatar">
					<img
						src={getAvatarUrl(first.url_foto, first.participante_nombre)}
						alt={first.participante_nombre}
						on:error={handleImageError}
					/>
				</div>
				<h4 class="podium-name">{first.participante_nombre}</h4>
				<p class="podium-faculty">{first.facultad_nombre || 'Sin facultad'}</p>
				<div class="podium-stats">
					<div class="podium-stat">
						<span class="stat-value">{first.total_proyectos || 0}</span>
						<span class="stat-label">Proyectos</span>
					</div>
					<div class="podium-stat">
						<span class="stat-value">{first.proyectos_como_director || 0}</span>
						<span class="stat-label">Director</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- 3rd Place - Bronze -->
		{#if topParticipantes[2]}
			{@const third = topParticipantes[2]}
			<div class="podium-place third">
				<div class="medal-container">
					<svg class="medal-svg bronze" viewBox="0 0 100 100">
						<circle cx="50" cy="50" r="45" fill="#CD7F32" />
						<circle cx="50" cy="50" r="35" fill="#E8A87C" />
						<text
							x="50"
							y="65"
							text-anchor="middle"
							fill="#6B4423"
							font-size="32"
							font-weight="bold">3</text
						>
					</svg>
				</div>
				<div class="podium-avatar">
					<img
						src={getAvatarUrl(third.url_foto, third.participante_nombre)}
						alt={third.participante_nombre}
						on:error={handleImageError}
					/>
				</div>
				<h4 class="podium-name">{third.participante_nombre}</h4>
				<p class="podium-faculty">{third.facultad_nombre || 'Sin facultad'}</p>
				<div class="podium-stats">
					<div class="podium-stat">
						<span class="stat-value">{third.total_proyectos || 0}</span>
						<span class="stat-label">Proyectos</span>
					</div>
					<div class="podium-stat">
						<span class="stat-value">{third.proyectos_como_director || 0}</span>
						<span class="stat-label">Director</span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Resto de Investigadores (4-15) -->
	{#if topParticipantes.length > 3}
		<div class="researchers-list">
			<h3 class="list-title">Top Investigadores #4-15</h3>
			<div class="researchers-grid">
				{#each topParticipantes.slice(3) as participant, index}
					<div class="researcher-card" class:highlight={index < 2}>
						<div class="researcher-rank">#{index + 4}</div>
						<div class="researcher-avatar">
							<img
								src={getAvatarUrl(participant.url_foto, participant.participante_nombre)}
								alt={participant.participante_nombre}
								on:error={handleImageError}
							/>
						</div>
						<div class="researcher-info">
							<h4 class="researcher-name">{participant.participante_nombre}</h4>
							<p class="researcher-faculty">{participant.facultad_nombre || 'Sin facultad'}</p>
							<div class="researcher-stats">
								<span class="stat-item">
									<strong>{participant.total_proyectos || 0}</strong> proyectos
								</span>
								<span class="stat-separator">•</span>
								<span class="stat-item">
									<strong>{participant.proyectos_como_director || 0}</strong> como director
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
{/if}

<style>
	/* Podium Container */
	.podium-container {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 2rem;
		padding: 3rem 2rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16px;
		margin-bottom: 3rem;
		position: relative;
		overflow: hidden;
	}

	.podium-container::before {
		content: '🏆';
		position: absolute;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 3rem;
		opacity: 0.2;
	}

	/* Podium Places */
	.podium-place {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1.5rem;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
		position: relative;
		z-index: 1;
	}

	.podium-place:hover {
		transform: translateY(-8px);
	}

	.podium-place.first {
		order: 2;
		min-height: 380px;
		border: 3px solid #ffd700;
		box-shadow: 0 12px 48px rgba(255, 215, 0, 0.3);
	}

	.podium-place.second {
		order: 1;
		min-height: 340px;
		border: 3px solid #c0c0c0;
	}

	.podium-place.third {
		order: 3;
		min-height: 320px;
		border: 3px solid #cd7f32;
	}

	/* Medal */
	.medal-container {
		position: absolute;
		top: -30px;
		width: 60px;
		height: 60px;
		z-index: 10;
	}

	.medal-svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
	}

	.medal-svg.gold {
		animation: shine 2s ease-in-out infinite;
	}

	@keyframes shine {
		0%,
		100% {
			filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.4));
		}
		50% {
			filter: drop-shadow(0 4px 16px rgba(255, 215, 0, 0.8));
		}
	}

	/* Avatar */
	.podium-avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		overflow: hidden;
		margin-bottom: 1rem;
		border: 4px solid #f3f4f6;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.podium-place.first .podium-avatar {
		width: 140px;
		height: 140px;
		border-color: #ffd700;
	}

	.podium-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Podium Info */
	.podium-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: #1f2937;
		text-align: center;
		margin: 0 0 0.5rem 0;
		font-family: var(--font--default);
	}

	.podium-place.first .podium-name {
		font-size: 1.25rem;
		color: #b8860b;
	}

	.podium-faculty {
		font-size: 0.875rem;
		color: #6b7280;
		text-align: center;
		margin: 0 0 1rem 0;
		font-family: var(--font--default);
	}

	.podium-stats {
		display: flex;
		gap: 1.5rem;
		margin-top: auto;
	}

	.podium-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.podium-stat .stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #6e29e7;
	}

	.podium-stat .stat-label {
		font-size: 0.75rem;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Researchers List */
	.researchers-list {
		margin-top: 3rem;
	}

	.list-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0 0 1.5rem 0;
		font-family: var(--font--default);
	}

	.researchers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.researcher-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.researcher-card:hover {
		border-color: var(--color--primary);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.1);
		transform: translateY(-2px);
	}

	.researcher-card.highlight {
		border-color: var(--color--primary);
		background: var(--color--primary-tint);
	}

	.researcher-rank {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--primary);
		min-width: 3rem;
		text-align: center;
	}

	.researcher-avatar {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		border: 2px solid rgba(var(--color--text-rgb), 0.1);
	}

	.researcher-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.researcher-info {
		flex: 1;
		min-width: 0;
	}

	.researcher-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.25rem 0;
		font-family: var(--font--default);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.researcher-faculty {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0 0 0.5rem 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.researcher-stats {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color--text-shade);
	}

	.stat-item strong {
		color: var(--color--primary);
		font-weight: 600;
	}

	.stat-separator {
		color: rgba(var(--color--text-rgb), 0.3);
	}

	@media (max-width: 1024px) {
		.podium-container {
			flex-direction: column;
			align-items: center;
			gap: 2rem;
			padding: 2rem 1rem;
		}

		.podium-place {
			min-height: auto !important;
			width: 100%;
			max-width: 400px;
		}

		.podium-place.first {
			order: 1;
		}

		.podium-place.second {
			order: 2;
		}

		.podium-place.third {
			order: 3;
		}

		.researchers-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
