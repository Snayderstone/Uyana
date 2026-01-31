<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher<{
		accept: void;
		cancel: void;
	}>();

	export let error: string = '';
	export let loading: boolean = false;

	// Ocultar chat widget cuando el modal esté abierto
	onMount(() => {
		const chatWidget = document.querySelector('.chat-widget');
		if (chatWidget) {
			(chatWidget as HTMLElement).style.display = 'none';
		}
	});

	onDestroy(() => {
		const chatWidget = document.querySelector('.chat-widget');
		if (chatWidget) {
			(chatWidget as HTMLElement).style.display = '';
		}
	});

	let termsAccepted = false;
	let privacyAccepted = false;
	let academicUseAccepted = false;

	$: allAccepted = termsAccepted && privacyAccepted && academicUseAccepted;

	function handleAccept() {
		if (allAccepted && !loading) {
			dispatch('accept');
		}
	}

	function handleCancel() {
		if (!loading) {
			dispatch('cancel');
		}
	}
</script>

<div class="modal-overlay">
	<div class="modal-content">
		<div class="modal-header">
			<h2>Términos y Condiciones de Acceso</h2>
			<p class="modal-subtitle">Para acceder al sistema, debe aceptar los siguientes términos:</p>
		</div>

		<div class="modal-body">
			<div class="consent-item">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={termsAccepted} />
					<span class="checkbox-text">
						He leído y acepto los
						<a href="/terminos" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a>
						del Sistema de Gestión de Proyectos de Investigación SIGPI.
					</span>
				</label>
			</div>

			<div class="consent-item">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={privacyAccepted} />
					<span class="checkbox-text">
						He leído y acepto la
						<a href="/privacidad" target="_blank" rel="noopener noreferrer"
							>Política de Privacidad</a
						>
						y entiendo cómo se procesarán mis datos personales conforme a la Ley Orgánica de Protección
						de Datos Personales del Ecuador.
					</span>
				</label>
			</div>

			<div class="consent-item">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={academicUseAccepted} />
					<span class="checkbox-text">
						Declaro que utilizaré la información de la plataforma SIGPI
						<strong
							>exclusivamente con fines académicos, educativos y de investigación científica</strong
						>, y que no haré uso comercial de los datos de propiedad de la de la Universidad Central
						del Ecuador que están bajo la responsabilidad de la Dirección de Investigación.
					</span>
				</label>
			</div>

			<div class="warning-box">
				<p>
					⚠️ <strong>Aviso Legal:</strong> Los datos expuestos son de propiedad institucional y están
					protegidos por las leyes de propiedad intelectual y protección de datos de Ecuador. El acceso
					no autorizado o el uso indebido puede estar sujeto a sanciones legales y/o disciplinarias.
				</p>
			</div>

			{#if error}
				<div class="error-box">
					{error}
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			<button type="button" class="btn-cancel" on:click={handleCancel} disabled={loading}>
				Cancelar
			</button>
			<button
				type="button"
				class="btn-accept"
				disabled={!allAccepted || loading}
				on:click={handleAccept}
			>
				{#if loading}
					<span class="spinner"></span>
					Guardando...
				{:else}
					Aceptar y Continuar
				{/if}
			</button>
		</div>
	</div>
</div>

<style lang="scss">
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10000;
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-content {
		background: #ffffff;
		border-radius: 12px;
		max-width: 750px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
		border: 1px solid #e5e7eb;
	}

	.modal-header {
		padding: 1.5rem 1.75rem 1rem;
		border-bottom: 1px solid #e5e7eb;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px 12px 0 0;

		h2 {
			margin: 0 0 0.5rem;
			color: #ffffff;
			font-size: 1.5rem;
			font-weight: 700;
		}

		.modal-subtitle {
			margin: 0;
			color: rgba(255, 255, 255, 0.9);
			font-size: 0.9rem;
		}
	}

	.modal-body {
		padding: 1.5rem 1.75rem;

		.consent-item {
			margin-bottom: 1rem;
		}

		.checkbox-label {
			display: flex;
			align-items: flex-start;
			cursor: pointer;
			line-height: 1.5;

			input[type='checkbox'] {
				-webkit-appearance: none;
				-moz-appearance: none;
				appearance: none;
				margin-top: 0.2rem;
				margin-right: 0.75rem;
				min-width: 18px;
				width: 18px;
				height: 18px;
				cursor: pointer;
				background-color: #ffffff;
				border: 2px solid #d1d5db;
				border-radius: 4px;
				position: relative;
				flex-shrink: 0;

				&:checked {
					background-color: #667eea;
					border-color: #667eea;

					&::after {
						content: '';
						position: absolute;
						left: 5px;
						top: 2px;
						width: 4px;
						height: 8px;
						border: solid white;
						border-width: 0 2px 2px 0;
						transform: rotate(45deg);
					}
				}

				&:hover {
					border-color: #667eea;
				}
			}

			.checkbox-text {
				color: #374151;
				font-size: 0.9rem;

				a {
					color: #667eea;
					text-decoration: none;
					font-weight: 600;

					&:hover {
						text-decoration: underline;
						color: #764ba2;
					}
				}

				strong {
					color: #1f2937;
					font-weight: 600;
				}
			}
		}

		.warning-box {
			background-color: #fef3c7;
			border: 1px solid #fbbf24;
			border-radius: 6px;
			padding: 0.875rem;
			margin-top: 1rem;

			p {
				margin: 0;
				color: #92400e;
				font-size: 0.85rem;
				line-height: 1.4;
			}
		}

		.error-box {
			background-color: #fee2e2;
			border: 1px solid #ef4444;
			color: #991b1b;
			padding: 0.875rem;
			border-radius: 6px;
			margin-top: 1rem;
			font-size: 0.85rem;
			text-align: center;
		}
	}

	.modal-footer {
		padding: 1rem 1.75rem 1.5rem;
		border-top: 1px solid #e5e7eb;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;

		button {
			padding: 0.625rem 1.25rem;
			border-radius: 6px;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			border: none;
			display: flex;
			align-items: center;
			gap: 0.5rem;

			.spinner {
				width: 14px;
				height: 14px;
				border: 2px solid #ffffff;
				border-top-color: transparent;
				border-radius: 50%;
				animation: spin 0.8s linear infinite;
			}

			&.btn-cancel {
				background-color: #f3f4f6;
				color: #6b7280;
				border: 1px solid #d1d5db;

				&:hover:not(:disabled) {
					background-color: #e5e7eb;
					border-color: #9ca3af;
				}

				&:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
			}

			&.btn-accept {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;

				&:hover:not(:disabled) {
					background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
					box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
				}

				&:disabled {
					background: #9ca3af;
					cursor: not-allowed;
					opacity: 0.6;
				}
			}
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	// Tablets
	@media (max-width: 768px) {
		.modal-content {
			max-width: 90%;
			margin: 1rem;
		}

		.modal-header {
			padding: 1.5rem 1.5rem 1rem;

			h2 {
				font-size: 1.35rem;
			}
		}

		.modal-body {
			padding: 1.5rem;
		}

		.modal-footer {
			padding: 1rem 1.5rem 1.5rem;
			flex-direction: row;
		}
	}

	// Móviles
	@media (max-width: 640px) {
		.modal-content {
			max-width: 95%;
			margin: 0.5rem;
			border-radius: 10px;
		}

		.modal-header,
		.modal-body,
		.modal-footer {
			padding-left: 1.25rem;
			padding-right: 1.25rem;
		}

		.modal-header {
			padding-top: 1.25rem;
			padding-bottom: 0.875rem;
			border-radius: 10px 10px 0 0;

			h2 {
				font-size: 1.15rem;
			}

			.modal-subtitle {
				font-size: 0.85rem;
			}
		}

		.modal-body {
			padding-top: 1.25rem;
			padding-bottom: 1.25rem;

			.checkbox-label {
				.checkbox-text {
					font-size: 0.85rem;
				}
			}

			.warning-box p {
				font-size: 0.8rem;
			}
		}

		.modal-footer {
			padding-top: 0.875rem;
			padding-bottom: 1.25rem;
			flex-direction: column;
			gap: 0.5rem;

			button {
				width: 100%;
				justify-content: center;
				padding: 0.75rem 1rem;
			}
		}
	}

	// Móviles pequeños
	@media (max-width: 380px) {
		.modal-content {
			max-width: 98%;
			margin: 0.25rem;
		}

		.modal-header h2 {
			font-size: 1.1rem;
		}
	}
</style>
