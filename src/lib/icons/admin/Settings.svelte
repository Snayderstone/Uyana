<script lang="ts">
	export let size: number = 24;
	export let strokeWidth: number = 2;
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<circle cx="12" cy="12" r="3" />
	<path
		d="M12 1v6m0 6v6m-7.07-7.07L1.46 8.46m6.36 6.36l-3.54 3.54M1 12h6m6 0h6m-7.07 7.07l-3.47 3.47m6.36-6.36l3.54 3.54"
	/>
	<path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
</svg>
