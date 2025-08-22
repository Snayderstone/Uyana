<script lang="ts">
	/** Texto del párrafo (obligatorio) */
	export let text: string;

	/** Activa/desactiva el glow/halo en hover */
	export let glow: boolean = true;

	/** Ajustes rápidos opcionales */
	export let radius: string = '12px';
	export let pad: string = '20px';
	export let className: string = '';
	export let style: string = '';
</script>

<section
	class={`ep-card ${className}`}
	data-glow={glow}
	style={`--radius:${radius}; --pad:${pad}; ${style}`}
	tabindex="0"
	aria-label="Párrafo destacado"
>
	<p class="ep-text">{text}</p>
</section>

<style lang="scss">
	.ep-card {
		position: relative;
		border-radius: var(--radius);
		padding: var(--pad);
		border: 1.5px solid rgba(255, 255, 255, 0.9);
		background: transparent;
		box-shadow: 0 1px 100px rgba(0, 0, 0, 0.08);
		overflow: clip;
	}

	/* Párrafo: cursiva y SIN transformar a mayúsculas */
	.ep-text {
		margin: 0;
		font-style: italic;
		line-height: 1.6;
		font-size: clamp(1rem, 0.6vw + 0.95rem, 1.25rem);
		text-transform: none !important; /* evita forzados globales */
	}

	/* --- Glow (borde + halo + “streaks” largos) sólo si glow=true --- */
	.ep-card::before,
	.ep-card::after {
		content: '';
		position: absolute;
		pointer-events: none;
		border-radius: inherit;
		opacity: 0;
		transition: opacity 220ms ease, filter 220ms ease;
	}

	/* Anillo + halo blanco */
	.ep-card::before {
		inset: 0;
		box-shadow: 0 0 0 200px rgba(255, 255, 255, 0.95), 0 0 400px 14px rgba(255, 255, 255, 0.35);
	}

	/* “streaks” en los bordes externos */
	.ep-card::after {
		inset: -10px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent 60%) top / 100% 26px
				no-repeat,
			linear-gradient(0deg, rgba(255, 255, 255, 0.4), transparent 60%) bottom / 100% 26px no-repeat,
			linear-gradient(90deg, rgba(255, 255, 255, 0.5), transparent 60%) left / 28px 100% no-repeat,
			linear-gradient(270deg, rgba(255, 255, 255, 0.5), transparent 60%) right / 28px 100% no-repeat;
		filter: blur(0.5px);
	}

	/* Hover/focus sólo cuando data-glow=true */
	@media (hover: hover) and (pointer: fine) {
		.ep-card[data-glow='true']:hover::before,
		.ep-card[data-glow='true']:hover::after {
			opacity: 1;
		}
	}
	.ep-card[data-glow='true']:focus-visible::before,
	.ep-card[data-glow='true']:focus-visible::after {
		opacity: 1;
		outline: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.ep-card::before,
		.ep-card::after {
			transition: none;
		}
	}

</style>
