<script lang="ts">
	// Puedes añadir props si necesitas personalizar el icono
	export let width = 24;
	export let height = 24;
	export let color = 'currentColor';
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	{width}
	{height}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<rect x="3" y="3" width="18" height="18" rx="2" />
	<path d="M8 15v2" />
	<path d="M12 13v4" />
	<path d="M16 11v6" />
	<path d="M9 7h.01" />
	<path d="M15 7h.01" />
</svg>
