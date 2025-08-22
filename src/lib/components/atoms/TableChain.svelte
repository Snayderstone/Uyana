<script>
	/** @type {string[]} */
	export let columns = [];
	/** @type {string[][]} */
	export let rows = [];
	// opcionales si expusiste personalización
	export let accent = 'var(--color--secondary)';
	export let headerBorder = '#fff';
</script>

<table class="glow-table" style={`--accent:${accent}; --header-border:${headerBorder};`}>
	<thead>
		<tr>
			{#each columns as col, i}
				<th class:first={i === 0} class:last={i === columns.length - 1}>{col}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each rows as row}
			<tr>
				{#each row as cell, i}
					<td class:first={i === 0} class:last={i === row.length - 1}>{cell}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.glow-table {
		width: 100%;
		border-collapse: collapse; /* sin bordes internos visibles */
		border-spacing: 0;
		font: inherit;
	}

	.glow-table th,
	.glow-table td {
		padding: 12px 14px;
		text-align: left;
	}

	/* ====== CABECERA: únicos bordes visibles + brillo ====== */
	.glow-table thead th {
		border: 1px solid var(--header-border);
		font-weight: 600;
		background: rgba(255, 255, 255, 0.06);
		position: relative;
	}
	/* brillo sutil alrededor de cada th */
	.glow-table thead th::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.25), 0 0 18px rgba(255, 255, 255, 0.15);
	}
	/* opcional: esquinas suaves de la cabecera */
	.glow-table thead th.first {
		border-top-left-radius: 8px;
	}
	.glow-table thead th.last {
		border-top-right-radius: 8px;
	}

	/* ====== CUERPO: sin bordes visibles por defecto ====== */
	.glow-table tbody td {
		border: none;
		background: transparent;
		transition: background 160ms ease;
	}

	/* ====== HOVER POR FILA: borde iluminado (rectángulo completo) ======
     - Usamos el modelo de bordes colapsados: aplicamos borde superior e inferior
       a TODAS las celdas de la fila en hover
     - Y borde izquierdo/derecho solo a la primera/última celda
     - Resultado: un rectángulo limpio que rodea toda la fila
  */
	.glow-table tbody tr:hover td {
		background: color-mix(in oklab, var(--accent) 7%, transparent); /* realce suave */
		border-top: 2px solid var(--accent);
		border-bottom: 2px solid var(--accent);
	}
	.glow-table tbody tr:hover td.first {
		border-left: 2px solid var(--accent);
		border-top-left-radius: 10px;
		border-bottom-left-radius: 10px;
	}
	.glow-table tbody tr:hover td.last {
		border-right: 2px solid var(--accent);
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
	}

	/* “Halo” suave del rectángulo usando shadows laterales en extremos */
	.glow-table tbody tr:hover td.first::before,
	.glow-table tbody tr:hover td.last::after {
		content: '';
		position: absolute;
		top: -4px;
		bottom: -4px;
		width: 6px;
		pointer-events: none;
		filter: blur(4px);
		background: var(--accent);
		opacity: 0.45;
	}
	.glow-table tbody tr:hover td.first::before {
		left: -3px;
		border-radius: 8px;
	}
	.glow-table tbody tr:hover td.last::after {
		right: -3px;
		border-radius: 8px;
	}

	/* Accesibilidad: mismo estilo al navegar con teclado */
	.glow-table tbody tr:focus-within td {
		background: color-mix(in oklab, var(--accent) 7%, transparent);
		border-top: 2px solid var(--accent);
		border-bottom: 2px solid var(--accent);
	}
	.glow-table tbody tr:focus-within td.first {
		border-left: 2px solid var(--accent);
		border-top-left-radius: 10px;
		border-bottom-left-radius: 10px;
	}
	.glow-table tbody tr:focus-within td.last {
		border-right: 2px solid var(--accent);
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
	}

	/* Mantén el texto por encima de cualquier pseudo-elemento */
	.glow-table td {
		position: relative;
		z-index: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.glow-table tbody td {
			transition: none;
		}
	}
</style>
