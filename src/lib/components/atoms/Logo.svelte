<script>
	export let animated = true;
</script>

<div class="logo" class:animated>
	<div class="logo-icon">
		<img src="/favicons/favicon-32x32.png" alt="Uyana Logo" width="32" height="32" />
	</div>
	<div class="logo-text" class:animated>
		<span class="logo-name">UYANA</span>
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

		.logo-text {
			display: flex;
			align-items: center;
			font-weight: 700;
			font-size: 1.5rem;
			letter-spacing: 0.5px;
			color: var(--color--text);
			transition: all 0.2s ease-in-out;

			.logo-name {
				font-weight: 900;
				background: linear-gradient(
					90deg,
					rgb(var(--color--primary-rgb)) 0%,
					rgb(var(--color--secondary-rgb)) 100%
				);
				text-shadow: 0px 0px 1px rgba(var(--color--primary-rgb), 0.1);
				background-clip: text;
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;

				@include for-phone-only {
					font-size: 1.2rem;
				}
			}

			@include for-phone-only {
				font-size: 1rem;
			}
		}

		&:hover {
			.logo-icon img {
				transform: scale(1.1);
			}

			.logo-text {
				filter: drop-shadow(0px 0px 3px var(--color--primary));
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
