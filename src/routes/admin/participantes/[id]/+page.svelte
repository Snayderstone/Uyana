<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { ParticipanteResponseDTO } from '$lib/models/admin';
	import { icons } from '$lib/components/admin/shared';

	// Get ID from URL
	$: participanteId = $page.params.id;

	// State
	let participante: ParticipanteResponseDTO | null = null;
	let loading = false;
	let error: string | null = null;
	let showDeleteModal = false;
	let deleting = false;

	// Toast notifications
	let showToast = false;
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' = 'info';

	/**
	 * Fetch participant details
	 */
	async function fetchParticipante() {
		if (!browser || !participanteId) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/admin/participants/${participanteId}`);

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success && result.data) {
				participante = result.data;
			} else {
				throw new Error(result.message || 'Participante no encontrado');
			}
		} catch (err) {
			console.error('Error fetching participante:', err);
			error = err instanceof Error ? err.message : 'Error al cargar el participante';
		} finally {
			loading = false;
		}
	}

	/**
	 * Delete participant
	 */
	async function deleteParticipante() {
		if (!participanteId) return;

		deleting = true;

		try {
			const response = await fetch(`/api/admin/participants/${participanteId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success) {
				showToast = true;
				toastMessage = 'Participante eliminado exitosamente';
				toastType = 'success';

				// Redirect after showing toast
				setTimeout(() => {
					goto('/admin/participantes/tabla');
				}, 1500);
			} else {
				throw new Error(result.message || 'Error al eliminar');
			}
		} catch (err) {
			console.error('Error deleting participante:', err);
			error = err instanceof Error ? err.message : 'Error al eliminar el participante';
			showToast = true;
			toastMessage = error || 'Error al eliminar el participante';
			toastType = 'error';
		} finally {
			deleting = false;
			showDeleteModal = false;
		}
	}

	/**
	 * Show toast notification
	 */
	function hideToast() {
		showToast = false;
		toastMessage = '';
	}

	// Auto-hide toast after 5 seconds
	$: if (showToast) {
		setTimeout(hideToast, 5000);
	}

	/**
	 * Get initials from name
	 */
	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}

	/**
	 * Detect if URL is base64
	 */
	function isBase64Image(url: string): boolean {
		return url.startsWith('data:image/');
	}

	/**
	 * Get image source - handles both URL and base64
	 */
	function getImageSource(photoUrl: string): string {
		if (!photoUrl) return '';

		// Si es base64, retornarlo directamente
		if (isBase64Image(photoUrl)) {
			return photoUrl;
		}

		// Si es URL, retornarlo directamente
		return photoUrl;
	}

	/**
	 * Parse and classify social networks
	 */
	interface SocialNetwork {
		type: string;
		url: string;
		icon: string;
		color: string;
		label: string;
	}

	function parseSocialNetworks(redesSociales: string | null): SocialNetwork[] {
		if (!redesSociales) return [];

		const urls = redesSociales
			.split('|')
			.map((url) => url.trim())
			.filter((url) => url);
		const networks: SocialNetwork[] = [];

		urls.forEach((url) => {
			const lowerUrl = url.toLowerCase();

			if (lowerUrl.includes('orcid.org')) {
				networks.push({
					type: 'orcid',
					url,
					icon: icons.external,
					color: '#A6CE39',
					label: 'ORCID'
				});
			} else if (lowerUrl.includes('researchgate.net')) {
				networks.push({
					type: 'researchgate',
					url,
					icon: icons.external,
					color: '#00D0AF',
					label: 'ResearchGate'
				});
			} else if (lowerUrl.includes('scholar.google')) {
				networks.push({
					type: 'google-scholar',
					url,
					icon: icons.external,
					color: '#4285F4',
					label: 'Google Scholar'
				});
			} else if (lowerUrl.includes('academia.edu')) {
				networks.push({
					type: 'academia',
					url,
					icon: icons.external,
					color: '#41454A',
					label: 'Academia.edu'
				});
			} else if (lowerUrl.includes('facebook.com')) {
				networks.push({
					type: 'facebook',
					url,
					icon: icons.external,
					color: '#1877F2',
					label: 'Facebook'
				});
			} else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
				networks.push({
					type: 'twitter',
					url,
					icon: icons.external,
					color: '#1DA1F2',
					label: 'Twitter / X'
				});
			} else if (lowerUrl.includes('linkedin.com')) {
				networks.push({
					type: 'linkedin',
					url,
					icon: icons.external,
					color: '#0A66C2',
					label: 'LinkedIn'
				});
			} else if (lowerUrl.includes('scopus.com')) {
				networks.push({
					type: 'scopus',
					url,
					icon: icons.external,
					color: '#E9711C',
					label: 'Scopus'
				});
			} else {
				// Otro sitio web genérico
				networks.push({
					type: 'web',
					url,
					icon: icons.external,
					color: '#718096',
					label: 'Sitio Web'
				});
			}
		});

		return networks;
	}

	onMount(() => {
		fetchParticipante();
	});
</script>

<div class="participante-detalle-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-left">
			<button class="btn-back" on:click={() => goto('/admin/participantes/tabla')}>
				{@html icons.arrowLeft}
				<span>Volver a la lista</span>
			</button>
			<h1>Detalles del Participante</h1>
		</div>
		<div class="header-actions">
			<button
				class="btn-secondary"
				on:click={() => goto(`/admin/participantes/editar/${participanteId}`)}
				disabled={loading || !!error}
			>
				{@html icons.edit}
				<span>Editar</span>
			</button>
			<button
				class="btn-danger"
				on:click={() => (showDeleteModal = true)}
				disabled={loading || !!error}
			>
				{@html icons.delete}
				<span>Eliminar</span>
			</button>
		</div>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando participante...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">{@html icons.error}</div>
			<h3>Error al cargar</h3>
			<p>{error}</p>
			<button class="btn-primary" on:click={fetchParticipante}>Reintentar</button>
		</div>
	{:else if participante}
		<div class="detalle-container">
			<!-- Profile Card -->
			<div class="profile-card">
				<div class="profile-header">
					{#if participante.foto}
						<img
							src={getImageSource(participante.foto)}
							alt={participante.nombre}
							class="profile-avatar"
							on:error={() => console.log('Error cargando imagen')}
						/>
					{:else}
						<div class="profile-avatar-placeholder">
							{getInitials(participante.nombre)}
						</div>
					{/if}
					<div class="profile-info">
						<h2>{participante.nombre}</h2>
						<p class="profile-email">{participante.email || 'No especificado'}</p>
						<div class="profile-badges">
							<span class="badge badge-genero">{participante.genero}</span>
							<span class="badge {participante.acreditado ? 'badge-success' : 'badge-warning'}">
								{participante.acreditado ? 'Acreditado' : 'No Acreditado'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Details Grid -->
			<div class="details-grid">
				<!-- Academic Information -->
				<div class="detail-card">
					<div class="card-header">
						<div class="card-icon">{@html icons.user}</div>
						<h3>Información Académica</h3>
					</div>
					<div class="card-content">
						<div class="detail-row">
							<span class="detail-label">Carrera:</span>
							<span class="detail-value">{participante.carrera?.nombre || 'No especificado'}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Facultad:</span>
							<span class="detail-value">
								{participante.carrera?.facultad?.nombre || 'No especificado'}
							</span>
						</div>
					</div>
				</div>

				<!-- Social Media -->
				{#if participante.redes_sociales}
					{@const socialNetworks = parseSocialNetworks(participante.redes_sociales)}
					{#if socialNetworks.length > 0}
						<div class="detail-card social-card">
							<div class="card-header">
								<div class="card-icon">{@html icons.link}</div>
								<h3>Redes Sociales y Perfiles Académicos</h3>
							</div>
							<div class="card-content">
								<div class="social-networks-grid">
									{#each socialNetworks as network}
										<a
											href={network.url}
											target="_blank"
											rel="noopener noreferrer"
											class="social-network-item"
											style="--network-color: {network.color}"
										>
											<div class="network-icon">
												{@html network.icon}
											</div>
											<div class="network-info">
												<span class="network-label">{network.label}</span>
												<span class="network-url">{network.url}</span>
											</div>
											<div class="network-arrow">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
													<polyline points="15 3 21 3 21 9" />
													<line x1="10" y1="14" x2="21" y2="3" />
												</svg>
											</div>
										</a>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				{/if}

				<!-- System Information -->
				<div class="detail-card">
					<div class="card-header">
						<div class="card-icon">{@html icons.database}</div>
						<h3>Información del Sistema</h3>
					</div>
					<div class="card-content">
						<div class="detail-row">
							<span class="detail-label">ID:</span>
							<span class="detail-value mono">{participante.id}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Fecha de Creación:</span>
							<span class="detail-value">
								{participante.created_at
									? new Date(participante.created_at).toLocaleString('es-ES')
									: 'No disponible'}
							</span>
						</div>
						{#if participante.updated_at}
							<div class="detail-row">
								<span class="detail-label">Última Actualización:</span>
								<span class="detail-value">
									{new Date(participante.updated_at).toLocaleString('es-ES')}
								</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showDeleteModal = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Confirmar Eliminación</h3>
				<button class="close-btn" on:click={() => (showDeleteModal = false)}>
					{@html icons.close}
				</button>
			</div>
			<div class="modal-body">
				<p>
					¿Estás seguro de que deseas eliminar al participante <strong
						>{participante?.nombre}</strong
					>?
				</p>
				<p class="text-danger">Esta acción no se puede deshacer.</p>
			</div>
			<div class="modal-footer">
				<button class="btn-secondary" on:click={() => (showDeleteModal = false)}> Cancelar </button>
				<button class="btn-danger" on:click={deleteParticipante} disabled={deleting}>
					{#if deleting}
						<span class="spinner-sm" />
					{:else}
						{@html icons.delete}
					{/if}
					Eliminar
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Notification -->
{#if showToast}
	<div class="toast toast-{toastType}">
		<div class="toast-content">
			<div class="toast-icon">
				{#if toastType === 'success'}
					{@html icons.check}
				{:else if toastType === 'error'}
					{@html icons.error}
				{:else}
					{@html icons.info}
				{/if}
			</div>
			<span class="toast-message">{toastMessage}</span>
		</div>
		<button class="toast-close" on:click={hideToast}>
			{@html icons.close}
		</button>
	</div>
{/if}

<style lang="scss">
	.participante-detalle-page {
		max-width: 1400px;
		margin: 0 auto;
	}

	// ==================== Header ====================
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		h1 {
			font-size: 2rem;
			font-weight: 700;
			color: var(--color--text);
			margin: 0;
			letter-spacing: -0.025em;
		}
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 6px;
		color: var(--color--text-shade);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;

		:global(svg) {
			width: 16px;
			height: 16px;
		}

		&:hover {
			background: rgba(var(--color--text-rgb), 0.03);
			border-color: rgba(var(--color--text-rgb), 0.15);
			color: var(--color--text);
		}
	}

	// ==================== Buttons ====================
	button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;

		:global(svg) {
			width: 16px;
			height: 16px;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.btn-primary {
		background: #6e29e7;
		color: white;

		&:hover:not(:disabled) {
			background: #5a1fc7;
		}
	}

	.btn-secondary {
		background: rgba(var(--color--text-rgb), 0.05);
		color: var(--color--text);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.1);
			border-color: #6e29e7;
		}
	}

	.btn-danger {
		background: #e53e3e;
		color: white;

		&:hover:not(:disabled) {
			background: #c53030;
		}
	}

	// ==================== Profile Card ====================
	.profile-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.profile-avatar,
	.profile-avatar-placeholder {
		width: 120px;
		height: 120px;
		min-width: 120px;
		min-height: 120px;
		border-radius: 50%;
		object-fit: cover;
		aspect-ratio: 1 / 1;
		flex-shrink: 0;
	}

	.profile-avatar-placeholder {
		background: linear-gradient(135deg, #6e29e7 0%, #8b5cf6 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 3rem;
	}

	.profile-info {
		flex: 1;

		h2 {
			font-size: 1.875rem;
			font-weight: 700;
			color: var(--color--text);
			margin: 0 0 0.5rem 0;
		}
	}

	.profile-email {
		font-size: 1rem;
		color: var(--color--text-shade);
		margin: 0 0 1rem 0;
	}

	.profile-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	// ==================== Details Grid ====================
	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.detail-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		background: rgba(var(--color--text-rgb), 0.02);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

		h3 {
			font-size: 1rem;
			font-weight: 600;
			color: var(--color--text);
			margin: 0;
		}
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(110, 41, 231, 0.1);
		border-radius: 6px;
		color: #6e29e7;

		:global(svg) {
			width: 18px;
			height: 18px;
		}
	}

	.card-content {
		padding: 1.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 0;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

		&:last-child {
			border-bottom: none;
		}
	}

	.detail-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color--text-shade);
		flex-shrink: 0;
		margin-right: 1rem;
	}

	.detail-value {
		font-size: 0.875rem;
		color: var(--color--text);
		text-align: right;

		&.mono {
			font-family: 'Courier New', monospace;
			color: #8b5cf6;
		}
	}

	// ==================== Social Networks ====================
	.social-card {
		grid-column: 1 / -1;
	}

	.social-networks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	.social-network-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		position: relative;
		overflow: hidden;

		&:hover {
			border-color: var(--network-color);
			background: color-mix(in srgb, var(--network-color) 5%, transparent);
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

			.network-icon {
				background: var(--network-color);
				color: white;
				transform: scale(1.1);
			}

			.network-arrow {
				color: var(--network-color);
				transform: translate(2px, -2px);
			}
		}
	}

	.network-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		min-width: 36px;
		background: color-mix(in srgb, var(--network-color) 15%, transparent);
		color: var(--network-color);
		border-radius: 6px;
		transition: all 0.2s;

		:global(svg) {
			width: 18px;
			height: 18px;
		}
	}

	.network-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.network-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color--text);
	}

	.network-url {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.network-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color--text-shade);
		transition: all 0.2s;

		:global(svg) {
			width: 14px;
			height: 14px;
		}
	}

	// ==================== Badges ====================
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;

		&.badge-success {
			background: rgba(72, 187, 120, 0.2);
			color: #48bb78;
		}

		&.badge-warning {
			background: rgba(237, 137, 54, 0.2);
			color: #ed8936;
		}

		&.badge-genero {
			background: rgba(66, 153, 225, 0.2);
			color: #4299e1;
		}
	}

	// ==================== States ====================
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #2d3748;
		border-top-color: #6e29e7;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	.spinner-sm {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-icon {
		width: 64px;
		height: 64px;
		color: #e53e3e;
		margin-bottom: 1rem;

		:global(svg) {
			width: 100%;
			height: 100%;
		}
	}

	.error-state {
		h3 {
			font-size: 1.5rem;
			color: #ededed;
			margin: 0 0 0.5rem 0;
		}

		p {
			color: #a0aec0;
			margin: 0 0 1.5rem 0;
		}
	}

	// ==================== Modal ====================
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: #1a1f26;
		border: 1px solid #2d3748;
		border-radius: 12px;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #2d3748;

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
			color: #ededed;
			margin: 0;
		}
	}

	.close-btn {
		padding: 0.5rem;
		background: transparent;
		border: none;
		color: #a0aec0;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;

		:global(svg) {
			width: 20px;
			height: 20px;
		}

		&:hover {
			background: #2d3748;
			color: #ededed;
		}
	}

	.modal-body {
		padding: 1.5rem;

		p {
			color: #e2e8f0;
			margin: 0 0 1rem 0;
			line-height: 1.6;

			&:last-child {
				margin-bottom: 0;
			}

			&.text-danger {
				color: #fc8181;
				font-weight: 500;
			}
		}

		strong {
			color: #ededed;
		}
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #2d3748;
	}

	// ==================== Toast Notification ====================
	.toast {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1001;
		min-width: 300px;
		max-width: 400px;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		animation: slideIn 0.3s ease-out;

		&.toast-success {
			background: rgba(72, 187, 120, 0.1);
			border-color: #48bb78;
			color: #48bb78;
		}

		&.toast-error {
			background: rgba(229, 62, 62, 0.1);
			border-color: #e53e3e;
			color: #e53e3e;
		}

		&.toast-info {
			background: rgba(66, 153, 225, 0.1);
			border-color: #4299e1;
			color: #4299e1;
		}
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		flex-shrink: 0;

		:global(svg) {
			width: 16px;
			height: 16px;
		}
	}

	.toast-message {
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.4;
	}

	.toast-close {
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: currentColor;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.2s;
		flex-shrink: 0;

		:global(svg) {
			width: 16px;
			height: 16px;
		}

		&:hover {
			background: rgba(255, 255, 255, 0.1);
		}
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	// ==================== Avatar ====================
	// Avatar mejorado para soportar imágenes grandes
	.profile-avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid #2d3748;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transition: all 0.3s ease;
		cursor: pointer;

		&:hover {
			border-color: #6e29e7;
			transform: scale(1.05);
			box-shadow: 0 8px 25px rgba(110, 41, 231, 0.2);
		}
	}

	.profile-avatar-placeholder {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6e29e7 0%, #8b5cf6 100%);
		color: white;
		font-size: 2.5rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 4px solid #2d3748;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all 0.3s ease;

		&:hover {
			border-color: #6e29e7;
			transform: scale(1.05);
			box-shadow: 0 8px 25px rgba(110, 41, 231, 0.2);
		}
	}

	// ==================== Responsive ====================
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			justify-content: flex-start;
		}

		.profile-header {
			flex-direction: column;
			text-align: center;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}

		.detail-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.detail-value {
			text-align: left;
		}

		.toast {
			top: auto;
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
			min-width: auto;
		}
	}
</style>
