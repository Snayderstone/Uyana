<script>
	export let animated = true;
</script>

<div class="logo" class:animated>
	<div class="logo-icon">
		<img src="/favicons/favicon-32x32.png" alt="SIGPI Logo" width="120" height="120" />
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.logo {
		width: auto;
		height: 100%;
		display: flex;
		gap: 12px;
		align-items: center;
		transition: all 0.2s ease-in-out;

		@include for-phone-only {
			gap: 8px;
		}

		.logo-icon {
			display: flex;
			align-items: center;
			justify-content: center;

			img {
				transition: transform 0.3s ease;
				max-width: 100%;
				height: auto;
			}
		}

		

	}

	@keyframes logo-fade-in {
		0% {
			opacity: 0;
			transform: translateY(5px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media screen and (prefers-reduced-motion: no-preference) {
		.animated {
			animation: logo-fade-in 0.6s ease-out;
		}
	}
</style>
