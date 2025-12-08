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
	<path d="M7.5 12h9M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
	<path d="M14 16v4c0 .666 1 1 1.5 1 .517 0 5.5-2.5 5.5-4V7c0-1.5-5-3-6-3-.908 0-1 1.5-1 3" />
</svg>
