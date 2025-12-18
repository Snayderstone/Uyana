<script lang="ts">
	export let src: string | undefined = undefined;
	export let alt: string;
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let fallback: string = alt.charAt(0).toUpperCase();
</script>

<div class="avatar avatar-{size}">
	{#if src}
		<img {src} {alt} />
	{:else}
		<div class="avatar-fallback">{fallback}</div>
	{/if}
</div>

<style lang="scss">
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		overflow: hidden;
		background: var(--color--primary-tint);
		color: var(--color--primary);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		&-sm {
			width: 32px;
			height: 32px;
			font-size: 0.875rem;
		}

		&-md {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}

		&-lg {
			width: 56px;
			height: 56px;
			font-size: 1.25rem;
		}

		&-xl {
			width: 72px;
			height: 72px;
			font-size: 1.5rem;
		}

		.avatar-fallback {
			font-weight: 600;
		}
	}
</style>
