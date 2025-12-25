<script lang="ts">
	import { usuarioStore } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';

	let activeTab: 'perfil' | 'seguridad' = 'perfil';

	// Perfil
	let nombre = $usuarioStore?.nombre || '';
	let email = $usuarioStore?.email || '';
	let perfilLoading = false;
	let perfilMessage = '';
	let perfilMessageType: 'success' | 'error' = 'success';

	// Contraseña
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let passwordLoading = false;
	let passwordMessage = '';
	let passwordMessageType: 'success' | 'error' = 'success';

	async function handleUpdatePerfil() {
		perfilMessage = '';

		if (!nombre.trim()) {
			perfilMessage = 'El nombre es requerido';
			perfilMessageType = 'error';
			return;
		}

		perfilLoading = true;

		try {
			const response = await fetch('/api/admin/configuracion/perfil', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ nombre, email })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				perfilMessage = 'Perfil actualizado correctamente';
				perfilMessageType = 'success';

				// Actualizar el store reactivamente
				usuarioStore.set({
					...$usuarioStore,
					nombre: nombre.trim(),
					email: email.trim()
				});

				// Forzar recarga de la página para actualizar el layout
				setTimeout(() => window.location.reload(), 1000);
			} else {
				perfilMessage = data.error || 'Error al actualizar perfil';
				perfilMessageType = 'error';
			}
		} catch (error) {
			perfilMessage = 'Error de conexión. Por favor intente nuevamente.';
			perfilMessageType = 'error';
		} finally {
			perfilLoading = false;
		}
	}

	async function handleUpdatePassword() {
		passwordMessage = '';

		// Validaciones
		if (!currentPassword || !newPassword || !confirmPassword) {
			passwordMessage = 'Complete todos los campos';
			passwordMessageType = 'error';
			return;
		}

		if (newPassword.length < 8) {
			passwordMessage = 'La nueva contraseña debe tener al menos 8 caracteres';
			passwordMessageType = 'error';
			return;
		}

		if (newPassword !== confirmPassword) {
			passwordMessage = 'Las contraseñas no coinciden';
			passwordMessageType = 'error';
			return;
		}

		passwordLoading = true;

		try {
			const response = await fetch('/api/admin/configuracion/password', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					currentPassword,
					newPassword
				})
			});

			const data = await response.json();

			if (response.ok && data.success) {
				passwordMessage = 'Contraseña actualizada correctamente';
				passwordMessageType = 'success';

				// Limpiar campos
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
			} else {
				passwordMessage = data.error || 'Error al actualizar contraseña';
				passwordMessageType = 'error';
			}
		} catch (error) {
			passwordMessage = 'Error de conexión. Por favor intente nuevamente.';
			passwordMessageType = 'error';
		} finally {
			passwordLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Configuración - Admin Uyana</title>
</svelte:head>

<div class="configuracion-page">
	<div class="page-header">
		<div class="header-icon">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				<path
					d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1656 17.2551 20.3766 17.7642 20.3766 18.295C20.3766 18.8258 20.1656 19.3349 19.79 19.71C19.4149 20.0856 18.9058 20.2966 18.375 20.2966C17.8442 20.2966 17.3351 20.0856 16.96 19.71L16.9 19.65C16.4178 19.1783 15.6971 19.0477 15.08 19.32C14.4755 19.5791 14.0826 20.1724 14.08 20.83V21C14.08 22.1046 13.1846 23 12.08 23C10.9754 23 10.08 22.1046 10.08 21V20.91C10.0642 20.2327 9.63587 19.6339 9 19.4C8.38291 19.1277 7.66219 19.2583 7.18 19.73L7.12 19.79C6.74486 20.1656 6.23582 20.3766 5.705 20.3766C5.17418 20.3766 4.66514 20.1656 4.29 19.79C3.91445 19.4149 3.70343 18.9058 3.70343 18.375C3.70343 17.8442 3.91445 17.3351 4.29 16.96L4.35 16.9C4.82167 16.4178 4.95235 15.6971 4.68 15.08C4.42093 14.4755 3.82764 14.0826 3.17 14.08H3C1.89543 14.08 1 13.1846 1 12.08C1 10.9754 1.89543 10.08 3 10.08H3.09C3.76733 10.0642 4.36613 9.63587 4.6 9C4.87235 8.38291 4.74167 7.66219 4.27 7.18L4.21 7.12C3.83445 6.74486 3.62343 6.23582 3.62343 5.705C3.62343 5.17418 3.83445 4.66514 4.21 4.29C4.58514 3.91445 5.09418 3.70343 5.625 3.70343C6.15582 3.70343 6.66486 3.91445 7.04 4.29L7.1 4.35C7.58219 4.82167 8.30291 4.95235 8.92 4.68H9C9.60447 4.42093 9.99738 3.82764 10 3.17V3C10 1.89543 10.8954 1 12 1C13.1046 1 14 1.89543 14 3V3.09C14.0026 3.74764 14.3955 4.34093 15 4.6C15.6171 4.87235 16.3378 4.74167 16.82 4.27L16.88 4.21C17.2551 3.83445 17.7642 3.62343 18.295 3.62343C18.8258 3.62343 19.3349 3.83445 19.71 4.21C20.0856 4.58514 20.2966 5.09418 20.2966 5.625C20.2966 6.15582 20.0856 6.66486 19.71 7.04L19.65 7.1C19.1783 7.58219 19.0477 8.30291 19.32 8.92V9C19.5791 9.60447 20.1724 9.99738 20.83 10H21C22.1046 10 23 10.8954 23 12C23 13.1046 22.1046 14 21 14H20.91C20.2524 14.0026 19.6591 14.3955 19.4 15Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
		<div>
			<h1>Configuración</h1>
			<p class="subtitle">Administra tu cuenta y preferencias del sistema</p>
		</div>
	</div>

	<div class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'perfil'}
			on:click={() => (activeTab = 'perfil')}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
				<path
					d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Perfil
		</button>
		<button
			class="tab"
			class:active={activeTab === 'seguridad'}
			on:click={() => (activeTab = 'seguridad')}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
				<path
					d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path d="M12 8V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<circle cx="12" cy="16" r="1" fill="currentColor" />
			</svg>
			Seguridad
		</button>
	</div>

	<div class="tab-content">
		{#if activeTab === 'perfil'}
			<div class="section">
				<h2>Información del Perfil</h2>
				<p class="section-description">Actualiza tu información personal</p>

				<form on:submit|preventDefault={handleUpdatePerfil}>
					<div class="form-group">
						<label for="nombre">Nombre completo</label>
						<input
							id="nombre"
							type="text"
							bind:value={nombre}
							placeholder="Tu nombre"
							disabled={perfilLoading}
						/>
					</div>

					<div class="form-group">
						<label for="email">Correo electrónico</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="tu@email.com"
							disabled={perfilLoading}
						/>
					</div>

					{#if perfilMessage}
						<div
							class="message"
							class:success={perfilMessageType === 'success'}
							class:error={perfilMessageType === 'error'}
						>
							{perfilMessage}
						</div>
					{/if}

					<button type="submit" class="btn-primary" disabled={perfilLoading}>
						{perfilLoading ? 'Guardando...' : 'Guardar cambios'}
					</button>
				</form>
			</div>
		{:else if activeTab === 'seguridad'}
			<div class="section">
				<h2>Cambiar Contraseña</h2>
				<p class="section-description">Actualiza tu contraseña para mantener tu cuenta segura</p>

				<form on:submit|preventDefault={handleUpdatePassword}>
					<div class="form-group">
						<label for="current-password">Contraseña actual</label>
						<input
							id="current-password"
							type="password"
							bind:value={currentPassword}
							placeholder="Tu contraseña actual"
							disabled={passwordLoading}
							autocomplete="current-password"
						/>
					</div>

					<div class="form-group">
						<label for="new-password">Nueva contraseña</label>
						<input
							id="new-password"
							type="password"
							bind:value={newPassword}
							placeholder="Mínimo 8 caracteres"
							disabled={passwordLoading}
							autocomplete="new-password"
						/>
					</div>

					<div class="form-group">
						<label for="confirm-password">Confirmar nueva contraseña</label>
						<input
							id="confirm-password"
							type="password"
							bind:value={confirmPassword}
							placeholder="Repite la nueva contraseña"
							disabled={passwordLoading}
							autocomplete="new-password"
						/>
					</div>

					{#if passwordMessage}
						<div
							class="message"
							class:success={passwordMessageType === 'success'}
							class:error={passwordMessageType === 'error'}
						>
							{passwordMessage}
						</div>
					{/if}

					<button type="submit" class="btn-primary" disabled={passwordLoading}>
						{passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
					</button>
				</form>

				<div class="info-box">
					<div class="info-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
							<path
								d="M12 16V12M12 8H12.01"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</div>
					<div>
						<strong>Recomendaciones de seguridad:</strong>
						<ul>
							<li>Use al menos 8 caracteres</li>
							<li>Combine letras mayúsculas y minúsculas</li>
							<li>Incluya números y símbolos</li>
							<li>No use información personal</li>
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.configuracion-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1.5rem;
		animation: fadeIn 0.3s ease-out;
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

	.page-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1.25rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.08);

		.header-icon {
			width: 48px;
			height: 48px;
			border-radius: 12px;
			background: linear-gradient(135deg, var(--color--primary) 0%, #8b5cf6 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			box-shadow: 0 8px 24px rgba(110, 41, 231, 0.25);

			svg {
				color: white;
			}
		}

		h1 {
			font-size: 1.75rem;
			font-weight: 700;
			margin: 0 0 0.25rem 0;
			color: var(--color--text);
			background: linear-gradient(135deg, var(--color--primary) 0%, #8b5cf6 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.subtitle {
			color: var(--color--text-muted);
			font-size: 0.9rem;
			margin: 0;
		}
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		padding: 0.375rem;
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: var(--card-shadow);
	}

	.tab {
		flex: 1;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		color: var(--color--text-muted);
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;

		svg {
			transition: transform 0.2s ease;
		}

		&:hover:not(.active) {
			background: rgba(var(--color--text-rgb), 0.05);
			color: var(--color--text);

			svg {
				transform: translateY(-2px);
			}
		}

		&.active {
			background: linear-gradient(135deg, var(--color--primary) 0%, #8b5cf6 100%);
			color: white;
			box-shadow: 0 4px 16px rgba(110, 41, 231, 0.3);
			transform: translateY(-2px);

			svg {
				stroke: white;
				filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
			}
		}
	}

	.section {
		background: var(--color--card-background);
		border-radius: 12px;
		padding: 1.75rem;
		box-shadow: var(--card-shadow);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		animation: slideIn 0.3s ease-out;

		h2 {
			font-size: 1.35rem;
			font-weight: 700;
			margin-bottom: 0.375rem;
			color: var(--color--text);
		}

		.section-description {
			color: var(--color--text-muted);
			margin-bottom: 1.5rem;
			font-size: 0.95rem;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.form-group {
		margin-bottom: 1.25rem;

		label {
			display: block;
			margin-bottom: 0.75rem;
			font-weight: 600;
			color: var(--color--text);
			font-size: 0.95rem;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		input {
			width: 100%;
			padding: 0.75rem;
			border: 2px solid rgba(var(--color--text-rgb), 0.12);
			border-radius: 10px;
			font-size: 1rem;
			transition: all 0.2s ease;
			background: var(--color--surface);
			color: var(--color--text);
			font-family: inherit;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
				box-shadow: 0 0 0 4px rgba(110, 41, 231, 0.1);
				transform: translateY(-1px);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
				background: rgba(var(--color--text-rgb), 0.03);
			}

			&::placeholder {
				color: var(--color--text-muted);
			}
		}
	}

	.message {
		padding: 1rem 1.25rem;
		border-radius: 10px;
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		animation: slideDown 0.3s ease-out;

		&.success {
			background: rgba(16, 185, 129, 0.1);
			color: #059669;
			border: 2px solid rgba(16, 185, 129, 0.3);
		}

		&.error {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
			border: 2px solid rgba(239, 68, 68, 0.3);
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

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, var(--color--primary) 0%, #8b5cf6 100%);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 1.05rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 16px rgba(110, 41, 231, 0.3);

		&:hover:not(:disabled) {
			transform: translateY(-2px);
			box-shadow: 0 8px 24px rgba(110, 41, 231, 0.4);
		}

		&:active:not(:disabled) {
			transform: translateY(0);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none;
		}
	}

	.info-box {
		margin-top: 1.5rem;
		padding: 1.25rem;
		background: rgba(59, 130, 246, 0.05);
		border-left: 4px solid var(--color--primary);
		border-radius: 10px;
		display: flex;
		gap: 1rem;
		align-items: flex-start;

		.info-icon {
			flex-shrink: 0;
			width: 32px;
			height: 32px;
			border-radius: 6px;
			background: rgba(var(--color--primary-rgb), 0.1);
			display: flex;
			align-items: center;
			justify-content: center;

			svg {
				color: var(--color--primary);
				width: 18px;
				height: 18px;
			}
		}

		strong {
			color: var(--color--text);
			display: block;
			margin-bottom: 0.75rem;
			font-size: 1.05rem;
		}

		ul {
			margin: 0;
			padding-left: 1.5rem;
			color: var(--color--text-muted);

			li {
				margin: 0.5rem 0;
				line-height: 1.6;
			}
		}
	}

	@media (max-width: 768px) {
		.configuracion-page {
			padding: 1.5rem;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;

			.header-icon {
				width: 56px;
				height: 56px;
			}

			h1 {
				font-size: 1.75rem;
			}
		}

		.section {
			padding: 1.75rem;

			h2 {
				font-size: 1.5rem;
			}
		}

		.tabs {
			flex-direction: column;
			gap: 0.5rem;
		}

		.info-box {
			flex-direction: column;

			.info-icon {
				align-self: flex-start;
			}
		}
	}
</style>
