<!-- src/lib/components/molecules/DonutChart.svelte -->
<script lang="ts">
	export let data: Array<{ label: string; value: number; colorVarName?: string }> = [];
	export let title = '';
	export let width = 300;
	export let height = 300;
	export let innerRadius = 0.6; // Porcentaje (0.6 = 60% del radio)
	export let animationDuration = 1.5; // segundos
	export let showLabels = true;

	// Tamaño y posición del gráfico
	$: radius = Math.min(width, height) / 2;
	$: cx = width / 2;
	$: cy = height / 2;

	// Calcular valores y ángulos
	$: total = Math.max(
		0.1,
		data.reduce((sum, d) => sum + d.value, 0)
	);
	$: donutInnerRadius = radius * innerRadius;

	// Generar arcos para cada segmento
	$: arcs = calcArcs(data, total);

	function calcArcs(
		data: Array<{ label: string; value: number; colorVarName?: string }>,
		total: number
	) {
		let startAngle = 0;
		return data.map((d, i) => {
			const percentage = d.value / total;
			const angle = percentage * 360;
			const endAngle = startAngle + angle;

			const arc = {
				...d,
				startAngle,
				endAngle,
				percentage,
				color: d.colorVarName ? `var(${d.colorVarName})` : generateColor(i),
				largeArcFlag: angle > 180 ? 1 : 0,
				startX: cx + radius * Math.cos(((startAngle - 90) * Math.PI) / 180),
				startY: cy + radius * Math.sin(((startAngle - 90) * Math.PI) / 180),
				endX: cx + radius * Math.cos(((endAngle - 90) * Math.PI) / 180),
				endY: cy + radius * Math.sin(((endAngle - 90) * Math.PI) / 180),
				innerStartX: cx + donutInnerRadius * Math.cos(((startAngle - 90) * Math.PI) / 180),
				innerStartY: cy + donutInnerRadius * Math.sin(((startAngle - 90) * Math.PI) / 180),
				innerEndX: cx + donutInnerRadius * Math.cos(((endAngle - 90) * Math.PI) / 180),
				innerEndY: cy + donutInnerRadius * Math.sin(((endAngle - 90) * Math.PI) / 180),
				midAngle: startAngle + angle / 2
			};

			startAngle = endAngle;
			return arc;
		});
	}

	// Generar colores si no se proporciona colorVarName
	function generateColor(index: number) {
		const colors = [
			'var(--color--primary)',
			'var(--color--secondary)',
			'var(--color--yellow)',
			'var(--color--callout-accent--info)',
			'var(--color--callout-accent--success)',
			'var(--color--callout-accent--warning)'
		];
		return colors[index % colors.length];
	}

	// Posición del texto para cada segmento
	function getLabelPosition(arc: any) {
		const angle = arc.midAngle - 90;
		const labelRadius = radius * 0.85; // Posición entre el centro y el borde
		const x = cx + labelRadius * Math.cos((angle * Math.PI) / 180);
		const y = cy + labelRadius * Math.sin((angle * Math.PI) / 180);
		return { x, y };
	}

	// Alternativa para textos fuera del chart
	const uid = `donut-${Math.random().toString(36).substring(2)}`;

	// Estado para seguimiento de segmento resaltado
	let highlightedSegment: number | null = null;

	// Función para resaltar un segmento
	function highlightSegment(index: number) {
		highlightedSegment = index;
	}

	// Función para quitar el resaltado
	function resetHighlight() {
		highlightedSegment = null;
	}
</script>

<div class="donut-chart">
	{#if title}
		<h3 class="donut-chart__title">{title}</h3>
	{/if}

	<svg class="donut-chart__svg" {width} {height} viewBox="0 0 {width} {height}">
		<defs>
			{#each arcs as arc, i}
				<!-- Filtro para efecto de brillo -->
				<filter id="{uid}-glow-{i}" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
					<feColorMatrix
						in="blur"
						mode="matrix"
						values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
						result="glow"
					/>
					<feComposite in="SourceGraphic" in2="glow" operator="over" />
				</filter>
			{/each}
		</defs>

		<g class="segments">
			{#each arcs as arc, i}
				<!-- Usamos un grupo SVG con un evento para manejar el segmento -->
				<g
					class="segment-group"
					on:mouseover={() => highlightSegment(i)}
					on:mouseout={resetHighlight}
					on:focus={() => highlightSegment(i)}
					on:blur={resetHighlight}
					tabindex="0"
					role="button"
					aria-label="{arc.label}: {arc.value} ({Math.round(arc.percentage * 100)}%)"
				>
					<path
						class="segment"
						class:highlight={highlightedSegment === i}
						class:fade={highlightedSegment !== null && highlightedSegment !== i}
						d="M {arc.innerStartX} {arc.innerStartY} 
             L {arc.startX} {arc.startY} 
             A {radius} {radius} 0 {arc.largeArcFlag} 1 {arc.endX} {arc.endY} 
             L {arc.innerEndX} {arc.innerEndY} 
             A {donutInnerRadius} {donutInnerRadius} 0 {arc.largeArcFlag} 0 {arc.innerStartX} {arc.innerStartY} Z"
						fill={arc.color}
						stroke="var(--color--card-background)"
						stroke-width="1"
						filter="url(#{uid}-glow-{i})"
					>
						<animate
							attributeName="opacity"
							from="0"
							to="1"
							dur="{animationDuration}s"
							begin="{i * 0.1}s"
							fill="freeze"
						/>
					</path>
				</g>
			{/each}
		</g>

		{#if showLabels && arcs.length > 0}
			<g class="labels">
				{#each arcs as arc, i}
					{#if arc.percentage > 0.05}
						{@const pos = getLabelPosition(arc)}
						<g transform="translate({pos.x}, {pos.y})" opacity="0">
							<text
								class="percentage"
								text-anchor="middle"
								dominant-baseline="middle"
								font-weight="bold"
								font-size="0.9rem"
								fill="var(--color--text)"
							>
								{Math.round(arc.percentage * 100)}%
							</text>

							<animate
								attributeName="opacity"
								from="0"
								to="1"
								dur="{animationDuration}s"
								begin="{animationDuration * 0.5 + i * 0.1}s"
								fill="freeze"
							/>
						</g>
					{/if}
				{/each}
			</g>
		{/if}

		<!-- Círculo central -->
		<circle
			{cx}
			{cy}
			r={donutInnerRadius * 0.95}
			fill="var(--color--card-background)"
			stroke="var(--color--card-background)"
			stroke-width="2"
		/>

		{#if total > 0}
			<text
				x={cx}
				y={cy - 10}
				text-anchor="middle"
				dominant-baseline="middle"
				class="total-label"
				fill="var(--color--text-shade)"
			>
				Total
			</text>
			<text
				x={cx}
				y={cy + 15}
				text-anchor="middle"
				dominant-baseline="middle"
				class="total-value"
				fill="var(--color--text)"
			>
				{total}
			</text>
		{/if}
	</svg>

	<!-- Leyenda -->
	<div class="donut-chart__legend">
		{#each arcs as arc, i}
			<button
				class="legend-item"
				class:highlight={highlightedSegment === i}
				class:fade={highlightedSegment !== null && highlightedSegment !== i}
				style="--item-color: {arc.color}"
				on:mouseover={() => highlightSegment(i)}
				on:mouseout={() => resetHighlight()}
				on:focus={() => highlightSegment(i)}
				on:blur={() => resetHighlight()}
				aria-label="Highlight {arc.label}: {arc.value} ({Math.round(arc.percentage * 100)}%)"
			>
				<span class="legend-color" />
				<div class="legend-info">
					<span class="legend-label">{arc.label}</span>
					<span class="legend-value">
						{arc.value} <span class="legend-percentage">({Math.round(arc.percentage * 100)}%)</span>
					</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.donut-chart {
		background: color-mix(in srgb, var(--color--card-background) 95%, transparent);
		border-radius: var(--surface-radius, 0.75rem);
		padding: var(--surface-padding, 1rem);
		box-shadow: var(--card-shadow);
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--color--text);

		&__title {
			margin: 0 0 1rem 0;
			font-size: var(--font-size-md, 1.25rem);
			font-weight: 700;
			color: var(--color--text);
			text-align: center;
		}

		&__svg {
			width: 100%;
			height: auto;
			max-height: 300px;
		}

		&__legend {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 0.75rem;
			width: 100%;
			margin-top: 1.5rem;
			max-height: 300px;
			overflow-y: auto;
			padding-right: 0.5rem;
			scrollbar-width: thin;

			@include for-phone-only {
				grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
				max-height: 200px;
			}

			// Estilos para scrollbar en webkit
			&::-webkit-scrollbar {
				width: 6px;
			}

			&::-webkit-scrollbar-track {
				background: var(--color--card-background);
				border-radius: 8px;
			}

			&::-webkit-scrollbar-thumb {
				background: var(--color--text-shade);
				border-radius: 8px;
				opacity: 0.5;
			}
		}
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		padding: 0.5rem;
		border-radius: 0.25rem;
		transition: background-color 0.2s ease, transform 0.2s ease;
		cursor: pointer;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		font-family: inherit;

		&:hover,
		&:focus {
			background-color: color-mix(in srgb, var(--item-color) 15%, transparent);
			transform: translateY(-2px);
		}

		&:focus-visible {
			outline: 2px solid var(--item-color);
			outline-offset: 2px;
		}
	}

	.legend-color {
		width: 1rem;
		height: 1rem;
		border-radius: 4px;
		background-color: var(--item-color);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	.legend-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.legend-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--color--text-shade);
	}

	.legend-value {
		font-weight: 600;
		color: var(--color--text);
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.legend-percentage {
		font-weight: normal;
		font-size: 0.85em;
		color: var(--color--text-shade);
	}

	.segment-group {
		cursor: pointer;
		outline: none;

		&:focus {
			.segment {
				stroke: var(--color--text);
				stroke-width: 3px;
				stroke-dasharray: 5 3;
			}
		}
	}

	.segment {
		cursor: pointer;
		transition: transform 0.3s ease, filter 0.3s ease, opacity 0.3s ease, stroke 0.3s ease;
		transform-origin: center;

		&:hover,
		&.highlight {
			filter: brightness(1.1);
			transform: scale(1.05);
			filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.3));
		}

		&.fade {
			opacity: 0.3;
		}
	}

	.total-label {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.total-value {
		font-size: 1.5rem;
		font-weight: 700;
	}
</style>
