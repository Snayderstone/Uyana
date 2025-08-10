<script>
	export let animated = true;
</script>

<div class="logo" class:animated>
	<svg
		id="logo-text"
		width="723.84009"
		height="116.720268"
		viewBox="0 0 723.84009 116.720269"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<text xml:space="preserve" id="text" transform="translate(-278.77228,-206.83728)"
			><tspan x="275.57227" y="292.17088" id="tspan1319"
				><tspan style="font-size:106.667px;font-family:YoungSerif;" id="tspan1317">Site Logo</tspan
				></tspan
			></text
		>
	</svg>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.logo {
		width: auto;
		height: 100%;

		display: flex;
		gap: 16px;
		align-items: center;

		@include for-phone-only {
			gap: 8px;
		}

		#logo-text {
			width: auto;
			height: 100%;
			max-height: 28px;

			#text {
				transition: all 0.2s ease-in-out;
				fill: var(--color--text);
			}
		}

		&:hover {
			#logo-text {
				filter: drop-shadow(0px 0px 3px var(--color--primary));
			}
		}
	}

	@keyframes svg-text-stroke {
		0% {
			fill-opacity: 0;
			stroke: var(--text-color);
			stroke-dashoffset: 25%;
			stroke-dasharray: 0 50%;
			stroke-width: 2;
		}
		70% {
			fill-opacity: 0;
			stroke: var(--text-color);
			stroke-width: 2;
		}
		80%,
		100% {
			fill-opacity: 1;
			stroke: var(--text-color);
			stroke-dashoffset: -25%;
			stroke-dasharray: 50% 0;
			stroke-width: 0;
		}
	}

	@media screen and (prefers-reduced-motion: no-preference) {
		.animated {
			#text {
				animation: svg-text-stroke 3s;
				stroke-width: 2;
				--text-color: var(--color--text);
			}
		}
	}
</style>
