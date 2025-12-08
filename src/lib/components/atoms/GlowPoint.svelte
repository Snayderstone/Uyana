<!-- src/lib/components/atoms/GlowPoint.svelte -->
<script lang="ts">
	export let x: number = 100;
	export let y: number = 100;
	export let r: number = 6;
	// --- CÓDIGO NUEVO: color y parámetros del glow del punto ---
	export let color: string = 'var(--color--primary, #12d833)';
	export let glowBlur: number = 6; // intensidad del desenfoque del glow
	export let glowOpacity: number = 0.85;
	const uid = `gp-${Math.random().toString(36).slice(2)}`;
	// ======================================================
</script>

<!-- CÓDIGO NUEVO: filtro del glow del punto -->
<defs>
	<filter id="{uid}-pointGlow" x="-300%" y="-300%" width="600%" height="600%">
		<!-- blur de la forma -->
		<feGaussianBlur in="SourceGraphic" stdDeviation={glowBlur} result="g1" />
		<!-- controlar opacidad del glow -->
		<feComponentTransfer in="g1" result="g2">
			<feFuncA type="linear" slope={glowOpacity} />
		</feComponentTransfer>
		<feMerge>
			<feMergeNode in="g2" />
			<feMergeNode in="SourceGraphic" />
		</feMerge>
	</filter>
</defs>
<!-- FIN CÓDIGO NUEVO -->
<circle 
  cx={x}
  cy={y}
  r={r}
  fill="white"
  class="glow-point"
  style="color: {color}"           
  filter={"url(#" + uid + "-pointGlow)"} >
	<animate attributeName="r" values="6;7.5;6" dur="1.5s" repeatCount="indefinite" />
	<animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
</circle>

<style>
	.glow-point {
		filter: drop-shadow(0 0 4px white) drop-shadow(0 0 8px currentColor);
	}
</style>
