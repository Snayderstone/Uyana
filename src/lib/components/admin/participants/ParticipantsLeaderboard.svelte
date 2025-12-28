<script lang="ts">
	export let participants: any[] = [];

	const DEFAULT_AVATAR =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%236E29E7"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial, sans-serif" font-weight="bold"%3E👤%3C/text%3E%3C/svg%3E';

	const ITEMS_PER_PAGE = 5;
	let currentPage = 1;

	$: sortedParticipants = [...participants].sort((a, b) => b.total_proyectos - a.total_proyectos);
	$: topThree = sortedParticipants.slice(0, 3);
	$: restParticipants = sortedParticipants.slice(3);
	$: displayedParticipants = restParticipants.slice(0, currentPage * ITEMS_PER_PAGE);
	$: hasMoreParticipants = displayedParticipants.length < restParticipants.length;

	function loadMore() {
		currentPage += 1;
	}

	function getAvatarUrl(url_foto: string | null, nombre: string): string {
		if (url_foto && url_foto.trim() !== '') {
			return url_foto;
		}
		return DEFAULT_AVATAR;
	}

	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		if (img) {
			img.src = DEFAULT_AVATAR;
		}
	}

	interface SocialNetwork {
		type: string;
		url: string;
		color: string;
		label: string;
		icon: string;
	}

	function parseSocialNetworks(redesSociales: string | null): SocialNetwork[] {
		if (!redesSociales) return [];

		// Las redes sociales están separadas por ' | ' (pipe con espacios)
		const urls = redesSociales
			.split('|')
			.map((url) => url.trim())
			.filter((url) => url && url.startsWith('http'));

		const networks: SocialNetwork[] = [];

		urls.forEach((url) => {
			if (url.includes('orcid.org')) {
				networks.push({ type: 'orcid', url, color: '#A6CE39', label: 'ORCID', icon: 'orcid' });
			} else if (url.includes('scholar.google')) {
				networks.push({
					type: 'google-scholar',
					url,
					color: '#4285F4',
					label: 'Google Scholar',
					icon: 'scholar'
				});
			} else if (url.includes('researchgate.net')) {
				networks.push({
					type: 'researchgate',
					url,
					color: '#00D0AF',
					label: 'ResearchGate',
					icon: 'researchgate'
				});
			} else if (url.includes('scopus.com')) {
				networks.push({ type: 'scopus', url, color: '#E9711C', label: 'Scopus', icon: 'scopus' });
			} else if (url.includes('publons.com') || url.includes('webofscience.com')) {
				networks.push({
					type: 'publons',
					url,
					color: '#336699',
					label: 'Web of Science',
					icon: 'publons'
				});
			} else if (url.includes('linkedin.com')) {
				networks.push({
					type: 'linkedin',
					url,
					color: '#0077b5',
					label: 'LinkedIn',
					icon: 'linkedin'
				});
			} else if (url.includes('twitter.com') || url.includes('x.com')) {
				networks.push({
					type: 'twitter',
					url,
					color: '#1DA1F2',
					label: 'Twitter/X',
					icon: 'twitter'
				});
			} else if (url.includes('github.com')) {
				networks.push({ type: 'github', url, color: '#333', label: 'GitHub', icon: 'github' });
			} else if (url.includes('facebook.com')) {
				networks.push({
					type: 'facebook',
					url,
					color: '#1877f2',
					label: 'Facebook',
					icon: 'facebook'
				});
			} else if (url.includes('instagram.com')) {
				networks.push({
					type: 'instagram',
					url,
					color: '#E4405F',
					label: 'Instagram',
					icon: 'instagram'
				});
			} else if (url.includes('academia.edu')) {
				networks.push({
					type: 'academia',
					url,
					color: '#41454A',
					label: 'Academia.edu',
					icon: 'web'
				});
			} else {
				networks.push({ type: 'web', url, color: '#6366f1', label: 'Sitio Web', icon: 'web' });
			}
		});

		return networks;
	}

	function getMedalColor(position: number): string {
		if (position === 0) return 'gold';
		if (position === 1) return 'silver';
		return 'bronze';
	}
</script>

<div class="leaderboard-wrapper">
	<!-- Podium (Top 3) -->
	{#if topThree.length > 0}
		<div class="podium-container">
			{#each [topThree[1], topThree[0], topThree[2]] as participant, idx}
				{#if participant}
					{@const position = participant === topThree[0] ? 0 : participant === topThree[1] ? 1 : 2}
					{@const medalColor = getMedalColor(position)}
					<div class="podium-place {medalColor}">
						<!-- Medalla -->
						<div class="medal-container">
							<svg
								class="medal-svg {medalColor}"
								viewBox="0 0 100 100"
								xmlns="http://www.w3.org/2000/svg"
							>
								{#if medalColor === 'gold'}
									<circle cx="50" cy="50" r="45" fill="url(#goldGradient)" />
									<defs>
										<linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
											<stop offset="100%" style="stop-color:#ffed4e;stop-opacity:1" />
										</linearGradient>
									</defs>
								{:else if medalColor === 'silver'}
									<circle cx="50" cy="50" r="45" fill="url(#silverGradient)" />
									<defs>
										<linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" style="stop-color:#a8a8a8;stop-opacity:1" />
											<stop offset="100%" style="stop-color:#d0d0d0;stop-opacity:1" />
										</linearGradient>
									</defs>
								{:else}
									<circle cx="50" cy="50" r="45" fill="url(#bronzeGradient)" />
									<defs>
										<linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" style="stop-color:#cd7f32;stop-opacity:1" />
											<stop offset="100%" style="stop-color:#daa520;stop-opacity:1" />
										</linearGradient>
									</defs>
								{/if}
								<text
									x="50"
									y="60"
									text-anchor="middle"
									fill="#fff"
									font-size="40"
									font-weight="bold"
								>
									{position + 1}
								</text>
							</svg>
						</div>

						<!-- Avatar -->
						<div class="podium-avatar">
							<img
								src={getAvatarUrl(participant.url_foto, participant.participante_nombre)}
								alt={participant.participante_nombre}
								on:error={handleImageError}
							/>
						</div>

						<!-- Nombre -->
						<h3 class="podium-name">{participant.participante_nombre}</h3>

						<!-- Facultad y Carrera -->
						<p class="podium-faculty">{participant.facultad_nombre}</p>
						<p class="podium-career">{participant.carrera_nombre}</p>

						<!-- Redes Sociales -->
						{#if participant.redes_sociales}
							{@const socialNetworks = parseSocialNetworks(participant.redes_sociales)}
							{#if socialNetworks.length > 0}
								<div class="podium-social">
									{#each socialNetworks.slice(0, 6) as network}
										<a
											href={network.url}
											target="_blank"
											rel="noopener noreferrer"
											class="social-link-podium"
											style="background-color: {network.color};"
											title={network.label}
										>
											<span class="social-icon-mini">{network.icon.charAt(0).toUpperCase()}</span>
										</a>
									{/each}
								</div>
							{/if}
						{/if}

						<!-- Stats -->
						<div class="podium-stats">
							<div class="podium-stat">
								<div class="stat-value">{participant.total_proyectos}</div>
								<div class="stat-label">Proyectos</div>
							</div>
							<div class="podium-stat">
								<div class="stat-value">{participant.proyectos_como_director}</div>
								<div class="stat-label">Director</div>
							</div>
							<div class="podium-stat">
								<div class="stat-value">{participant.proyectos_como_investigador}</div>
								<div class="stat-label">Investigador</div>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Lista (4-20) -->
	{#if displayedParticipants.length > 0}
		<div class="leaderboard-list">
			{#each displayedParticipants as participant, idx}
				<div class="leaderboard-item">
					<div class="rank-badge">{idx + 4}</div>

					<div class="participant-avatar-small">
						<img
							src={getAvatarUrl(participant.url_foto, participant.participante_nombre)}
							alt={participant.participante_nombre}
							on:error={handleImageError}
						/>
					</div>

					<div class="participant-details">
						<h4 class="participant-name">{participant.participante_nombre}</h4>
						<p class="participant-subtitle">
							{participant.facultad_nombre}
						</p>
						<p class="participant-career">{participant.carrera_nombre}</p>

						{#if participant.redes_sociales}
							{@const socialNetworks = parseSocialNetworks(participant.redes_sociales)}
							{#if socialNetworks.length > 0}
								<div class="participant-social">
									{#each socialNetworks as network}
										<a
											href={network.url}
											target="_blank"
											rel="noopener noreferrer"
											class="social-link-small"
											style="background-color: {network.color};"
											title={network.label}
										>
											{#if network.icon === 'orcid'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c2.359 0 3.925-1.531 3.925-3.722 0-2.019-1.466-3.722-3.925-3.722h-2.297z"
													/>
												</svg>
											{:else if network.icon === 'scholar'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M12 24a7 7 0 110-14 7 7 0 010 14zm0-24L0 9.5l4.838 3.94A8 8 0 0112 9a8 8 0 017.162 4.44L24 9.5z"
													/>
												</svg>
											{:else if network.icon === 'researchgate'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 00-.112.437 8.365 8.365 0 00-.078.53 9.43 9.43 0 00-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.121 0 000 1.535c.005.218.01.37.015.453v.024c.032.447.087.903.165 1.372a9.036 9.036 0 00.313 1.34 8.681 8.681 0 00.517 1.256c.2.416.437.819.712 1.204.274.384.583.744.926 1.075.344.332.713.629 1.108.887.394.259.82.47 1.278.636a8.007 8.007 0 001.465.313c.225.033.451.056.678.07l.12.007c.08.003.16.005.239.006h.036a7.208 7.208 0 001.034-.081 7.405 7.405 0 001.01-.23c.32-.098.632-.22.933-.365.302-.145.59-.314.862-.507a6.35 6.35 0 001.413-1.426 6.526 6.526 0 00.912-1.867 6.404 6.404 0 00.305-2.016 6.498 6.498 0 00-.305-2.016 6.526 6.526 0 00-.912-1.867 6.35 6.35 0 00-1.413-1.426 6.066 6.066 0 00-.862-.507 6.753 6.753 0 00-.933-.365 7.405 7.405 0 00-1.01-.23 7.208 7.208 0 00-1.034-.081h-.036a7.371 7.371 0 00-.239.006l-.12.007a6.743 6.743 0 00-.678.07 8.007 8.007 0 00-1.465.313 7.19 7.19 0 00-1.278.636 7.07 7.07 0 00-1.108.887 7.153 7.153 0 00-.926 1.075 7.885 7.885 0 00-.712 1.204 8.681 8.681 0 00-.517 1.256 9.036 9.036 0 00-.313 1.34 10.526 10.526 0 00-.165 1.372v.024c-.005.083-.01.235-.015.453a31.121 31.121 0 000 1.535c0 .395.002.734.013 1.016.01.282.027.513.05.727.024.214.051.403.078.53.027.127.058.245.091.354.033.109.069.211.112.308.043.096.09.185.142.266.052.081.107.156.166.223.06.068.124.13.191.185.068.056.139.105.214.148.075.043.153.08.235.11.082.03.166.055.252.074.086.02.174.035.264.046.09.01.181.017.273.02.092.004.185.005.278.003h.05a3.024 3.024 0 00.31-.027c.103-.013.205-.03.306-.05.101-.021.201-.046.299-.074.098-.028.194-.06.288-.095a2.738 2.738 0 00.268-.12 2.636 2.636 0 00.247-.144 2.448 2.448 0 00.226-.167 2.317 2.317 0 00.203-.187 2.132 2.132 0 00.18-.205 2.007 2.007 0 00.156-.221 1.863 1.863 0 00.131-.234c.04-.083.077-.168.11-.254.034-.086.064-.174.091-.263.027-.089.05-.179.069-.27.02-.091.036-.184.048-.277.013-.093.022-.187.028-.282.006-.095.009-.19.009-.286 0-.095-.003-.19-.009-.285a2.997 2.997 0 00-.028-.282 3.097 3.097 0 00-.048-.277 3.18 3.18 0 00-.069-.27 3.267 3.267 0 00-.091-.263 3.356 3.356 0 00-.11-.254 3.438 3.438 0 00-.131-.234 3.513 3.513 0 00-.156-.221 3.573 3.573 0 00-.18-.205 3.62 3.62 0 00-.203-.187 3.652 3.652 0 00-.226-.167 3.669 3.669 0 00-.247-.144 3.674 3.674 0 00-.268-.12 3.665 3.665 0 00-.288-.095 3.643 3.643 0 00-.299-.074 3.609 3.609 0 00-.306-.05 3.563 3.563 0 00-.31-.027h-.05a3.517 3.517 0 00-.278.003 3.466 3.466 0 00-.273.02 3.406 3.406 0 00-.264.046 3.338 3.338 0 00-.252.074 3.262 3.262 0 00-.235.11 3.177 3.177 0 00-.214.148 3.084 3.084 0 00-.191.185 2.983 2.983 0 00-.166.223 2.875 2.875 0 00-.142.266c-.043.097-.08.199-.112.308a2.759 2.759 0 00-.091.354 2.635 2.635 0 00-.078.53 2.506 2.506 0 00-.05.727c-.011.282-.013.621-.013 1.016 0 .513.002 1.024 0 1.535-.005.218-.01.37-.015.453v.024a10.526 10.526 0 01-.165 1.372 9.036 9.036 0 01-.313 1.34 8.681 8.681 0 01-.517 1.256c-.2.416-.437.819-.712 1.204a7.153 7.153 0 01-.926 1.075c-.343.332-.713.629-1.108.887a7.19 7.19 0 01-1.278.636 8.007 8.007 0 01-1.465.313 6.743 6.743 0 01-.678.07l-.12.007a7.371 7.371 0 01-.239.006h-.036a7.208 7.208 0 01-1.034-.081 7.405 7.405 0 01-1.01-.23 6.753 6.753 0 01-.933-.365 6.066 6.066 0 01-.862-.507 6.35 6.35 0 01-1.413-1.426 6.526 6.526 0 01-.912-1.867 6.404 6.404 0 01-.305-2.016c0-.717.102-1.417.305-2.016a6.526 6.526 0 01.912-1.867 6.35 6.35 0 011.413-1.426c.272-.193.56-.362.862-.507.301-.145.613-.267.933-.365a7.405 7.405 0 011.01-.23 7.208 7.208 0 011.034-.081h.036c.08.001.16.003.239.006l.12.007c.227.014.453.037.678.07a8.007 8.007 0 011.465.313c.458.166.884.377 1.278.636.395.258.764.555 1.108.887.343.331.652.691.926 1.075.275.385.512.788.712 1.204.2.416.368.85.517 1.256a9.036 9.036 0 01.313 1.34c.078.469.133.925.165 1.372v.024c.005.083.01.235.015.453.005.51.005 1.022 0 1.535-.001.395-.003.734-.013 1.016a9.43 9.43 0 01-.05.727 8.365 8.365 0 01-.078.53c-.027.146-.058.279-.091.398a3.193 3.193 0 01-.112.437c-.243.744-.65 1.303-1.213 1.68-.565.375-1.255.565-2.073.565s-1.508-.19-2.073-.565c-.563-.377-.97-.936-1.213-1.68a3.193 3.193 0 01-.112-.437 8.365 8.365 0 01-.078-.53 9.43 9.43 0 01-.05-.727c-.01-.282-.013-.621-.013-1.016a31.121 31.121 0 010-1.535c.005-.218.01-.37.015-.453v-.024c.032-.447.087-.903.165-1.372a9.036 9.036 0 01.313-1.34c.149-.406.318-.797.517-1.256.2-.416.437-.819.712-1.204.274-.384.583-.744.926-1.075.344-.332.713-.629 1.108-.887.394-.259.82-.47 1.278-.636a8.007 8.007 0 011.465-.313c.225-.033.451-.056.678-.07l.12-.007c.08-.003.16-.005.239-.006h.036c.361-.003.717.024 1.034.081.318.057.629.138 1.01.23.32.098.632.22.933.365.302.145.59.314.862.507a6.35 6.35 0 011.413 1.426c.394.576.707 1.204.912 1.867.203.599.305 1.299.305 2.016s-.102 1.417-.305 2.016a6.526 6.526 0 01-.912 1.867 6.35 6.35 0 01-1.413 1.426c-.272.193-.56.362-.862.507a6.753 6.753 0 01-.933.365 7.405 7.405 0 01-1.01.23 7.208 7.208 0 01-1.034.081h-.036a7.371 7.371 0 01-.239-.006l-.12-.007a6.743 6.743 0 01-.678-.07 8.007 8.007 0 01-1.465-.313 7.19 7.19 0 01-1.278-.636 7.07 7.07 0 01-1.108-.887 7.153 7.153 0 01-.926-1.075 7.885 7.885 0 01-.712-1.204 8.681 8.681 0 01-.517-1.256 9.036 9.036 0 01-.313-1.34 10.526 10.526 0 01-.165-1.372v-.024c-.005-.083-.01-.235-.015-.453a31.121 31.121 0 010-1.535c.001-.395.003-.734.013-1.016.01-.282.027-.513.05-.727.024-.214.051-.403.078-.53.027-.127.058-.245.091-.354.033-.109.069-.211.112-.308.043-.096.09-.185.142-.266.052-.081.107-.156.166-.223.06-.068.124-.13.191-.185.068-.056.139-.105.214-.148.075-.043.153-.08.235-.11.082-.03.166-.055.252-.074.086-.02.174-.035.264-.046.09-.01.181-.017.273-.02.092-.004.185-.005.278-.003h.05c.106.003.212.012.31.027.103.013.205.03.306.05.101.021.201.046.299.074.098.028.194.06.288.095a2.738 2.738 0 01.268.12c.088.044.172.091.247.144.075.053.147.109.226.167.069.058.138.12.203.187.065.067.127.137.18.205.053.069.103.142.156.221.044.079.086.163.131.234.04.083.077.168.11.254.034.086.064.174.091.263.027.089.05.179.069.27.02.091.036.184.048.277.013.093.022.187.028.282.006.095.009.19.009.286 0 .095-.003.19-.009.285a2.997 2.997 0 01-.028.282 3.097 3.097 0 01-.048.277 3.18 3.18 0 01-.069.27 3.267 3.267 0 01-.091.263 3.356 3.356 0 01-.11.254 3.438 3.438 0 01-.131.234 3.513 3.513 0 01-.156.221 3.573 3.573 0 01-.18.205 3.62 3.62 0 01-.203.187 3.652 3.652 0 01-.226.167 3.669 3.669 0 01-.247.144 3.674 3.674 0 01-.268.12 3.665 3.665 0 01-.288.095 3.643 3.643 0 01-.299.074 3.609 3.609 0 01-.306.05 3.563 3.563 0 01-.31.027h-.05a3.517 3.517 0 01-.278-.003 3.466 3.466 0 01-.273-.02 3.406 3.406 0 01-.264-.046 3.338 3.338 0 01-.252-.074 3.262 3.262 0 01-.235-.11 3.177 3.177 0 01-.214-.148 3.084 3.084 0 01-.191-.185 2.983 2.983 0 01-.166-.223 2.875 2.875 0 01-.142-.266c-.043-.097-.08-.199-.112-.308a2.759 2.759 0 01-.091-.354 2.635 2.635 0 01-.078-.53 2.506 2.506 0 01-.05-.727c-.011-.282-.013-.621-.013-1.016 0-.513.002-1.024 0-1.535-.005-.218-.01-.37-.015-.453v-.024a10.526 10.526 0 00-.165-1.372 9.036 9.036 0 00-.313-1.34 8.681 8.681 0 00-.517-1.256c-.2-.416-.437-.819-.712-1.204a7.153 7.153 0 00-.926-1.075 7.07 7.07 0 00-1.108-.887 7.19 7.19 0 00-1.278-.636 8.007 8.007 0 00-1.465-.313 6.743 6.743 0 00-.678-.07l-.12-.007a7.371 7.371 0 00-.239-.006h-.036a7.208 7.208 0 00-1.034.081c-.318.057-.629.138-1.01.23-.32.098-.632.22-.933.365-.302.145-.59.314-.862.507a6.35 6.35 0 00-1.413 1.426 6.526 6.526 0 00-.912 1.867 6.404 6.404 0 00-.305 2.016z"
													/>
												</svg>
											{:else if network.icon === 'scopus'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M24 19.059l-3.93-1.48c-1.307 1.619-3.64 2.918-6.546 2.918-4.048 0-5.993-2.449-5.993-4.804 0-2.98 2.356-4.477 6.969-6.628 5.665-2.098 8.5-4.477 8.5-9.28 0-5.338-4.396-9.785-11.985-9.785C4.649 0 .253 4.203.253 9.772v2.098l3.93 1.48c1.307-2.098 3.64-3.64 7.28-3.64 4.048 0 5.993 1.98 5.993 4.477 0 2.825-2.122 4.195-6.546 6.3-5.665 2.356-8.923 4.548-8.923 9.608 0 5.104 4.516 9.905 12.002 9.905C20.255 24 23.766 21.624 24 19.059z"
													/>
												</svg>
											{:else if network.icon === 'publons'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm-1.073 18.564L7.5 17.34v-4.68l3.427-1.224v7.128zm2.146 0v-7.128L16.5 12.66v4.68l-3.427 1.224zM12 10.5L8.574 9.276 12 8.052l3.426 1.224L12 10.5z"
													/>
												</svg>
											{:else if network.icon === 'linkedin'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
													/>
												</svg>
											{:else if network.icon === 'twitter'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
													/>
												</svg>
											{:else if network.icon === 'github'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
													/>
												</svg>
											{:else if network.icon === 'facebook'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
													/>
												</svg>
											{:else if network.icon === 'instagram'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
													/>
												</svg>
											{:else}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path
														d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"
													/>
												</svg>
											{/if}
										</a>
									{/each}
								</div>
							{/if}
						{/if}
					</div>

					<div class="participant-metrics">
						<div class="metric-item">
							<div class="metric-value">{participant.total_proyectos}</div>
							<div class="metric-label">Proyectos</div>
						</div>
						<div class="metric-item">
							<div class="metric-value">{participant.proyectos_como_director}</div>
							<div class="metric-label">Director</div>
						</div>
						<div class="metric-item">
							<div class="metric-value">{participant.proyectos_como_investigador}</div>
							<div class="metric-label">Investigador</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Load More Button -->
		{#if hasMoreParticipants}
			<div class="load-more-container">
				<button class="load-more-btn" on:click={loadMore}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
					Cargar más participantes ({Math.min(
						ITEMS_PER_PAGE,
						restParticipants.length - displayedParticipants.length
					)})
				</button>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	.leaderboard-wrapper {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 1.5rem;
		max-width: 100%;
		overflow-x: hidden;

		@media (max-width: 968px) {
			padding: 1rem;
			gap: 1.5rem;
		}

		@media (max-width: 480px) {
			padding: 0.75rem;
			gap: 1rem;
		}
	}

	/* ========== PODIUM (TOP 3) ========== */
	.podium-container {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 1.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border-radius: 12px;
		max-width: 100%;
		overflow-x: auto;

		@media (max-width: 968px) {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
			padding: 1rem;
			margin-bottom: 1rem;
		}

		@media (max-width: 480px) {
			padding: 0.75rem;
			gap: 0.75rem;
		}
	}

	.podium-place {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 1.5rem;
		background: var(--color--card-background);
		border-radius: 16px;
		box-shadow: var(--card-shadow);
		transition: all 0.3s ease;
		position: relative;
		min-width: 280px;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);

		&:hover {
			transform: translateY(-8px);
			box-shadow: 0 8px 30px rgba(var(--color--text-rgb), 0.15);
		}

		&.gold {
			order: 2;
			min-height: 480px;
			background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 237, 78, 0.08));
			border: 2px solid rgba(255, 215, 0, 0.4);
		}

		&.silver {
			order: 1;
			min-height: 440px;
			background: linear-gradient(135deg, rgba(168, 168, 168, 0.2), rgba(192, 192, 192, 0.12));
			border: 2px solid rgba(168, 168, 168, 0.5);
		}

		&.bronze {
			order: 3;
			min-height: 420px;
			background: linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(218, 165, 32, 0.08));
			border: 2px solid rgba(205, 127, 50, 0.4);
		}

		@media (max-width: 768px) {
			min-width: 100%;
			width: 100%;

			&.gold,
			&.silver,
			&.bronze {
				order: unset;
				min-height: auto;
			}
		}
	}

	.medal-container {
		margin-bottom: 1rem;
	}

	.medal-svg {
		width: 70px;
		height: 70px;
		filter: drop-shadow(0 4px 8px rgba(var(--color--text-rgb), 0.15));
		animation: float 3s ease-in-out infinite;

		@media (max-width: 968px) {
			width: 60px;
			height: 60px;
		}
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.podium-avatar {
		width: 90px;
		height: 90px;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid rgba(var(--color--text-rgb), 0.15);
		box-shadow: 0 4px 16px rgba(var(--color--text-rgb), 0.1);

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.gold & {
			width: 100px;
			height: 100px;
			border-color: #ffd700;
			border-width: 4px;
			box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
		}

		.silver & {
			border-color: #a8a8a8;
			border-width: 4px;
			box-shadow: 0 4px 20px rgba(168, 168, 168, 0.4);
		}

		.bronze & {
			border-color: #cd7f32;
			border-width: 4px;
			box-shadow: 0 4px 20px rgba(205, 127, 50, 0.4);
		}

		@media (max-width: 968px) {
			width: 80px;
			height: 80px;

			.gold & {
				width: 90px;
				height: 90px;
			}
		}
	}

	.podium-name {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
		text-align: center;
		text-transform: capitalize;
		line-height: 1.3;
		max-width: 100%;
		word-wrap: break-word;

		.gold & {
			font-size: 1.3rem;
		}

		@media (max-width: 968px) {
			font-size: 1rem;

			.gold & {
				font-size: 1.15rem;
			}
		}
	}

	.podium-faculty,
	.podium-career {
		font-size: 0.8rem;
		color: var(--color--text-shade);
		text-align: center;
		margin: 0;
		text-transform: capitalize;
		line-height: 1.4;
		max-width: 100%;
		word-wrap: break-word;

		@media (max-width: 968px) {
			font-size: 0.75rem;
		}
	}

	.podium-social {
		display: flex;
		gap: 0.4rem;
		justify-content: center;
		margin: 0.5rem 0;
		flex-wrap: wrap;
		max-width: 100%;

		@media (max-width: 968px) {
			gap: 0.35rem;
			margin: 0.4rem 0;
		}
	}

	.social-link-podium {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		color: white;
		transition: all 0.2s ease;
		text-decoration: none;
		flex-shrink: 0;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 8px rgba(var(--color--text-rgb), 0.15);
		}

		svg {
			width: 14px;
			height: 14px;
		}

		@media (max-width: 968px) {
			width: 24px;
			height: 24px;
		}
	}

	.social-icon-mini {
		font-size: 0.65rem;
		font-weight: 700;
		line-height: 1;
	}

	.podium-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-top: 0.75rem;
		width: 100%;
		max-width: 100%;

		@media (max-width: 968px) {
			gap: 0.4rem;
			margin-top: 0.5rem;
		}
	}

	.podium-stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.625rem 0.375rem;
		background: var(--color--primary-tint);
		border-radius: 8px;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		min-width: 0;

		.stat-value {
			font-size: 1.375rem;
			font-weight: 700;
			color: var(--color--text);
			line-height: 1;
			margin-bottom: 0.25rem;
		}

		.stat-label {
			font-size: 0.625rem;
			color: var(--color--text-shade);
			text-transform: uppercase;
			letter-spacing: 0.2px;
			margin-top: 0.125rem;
			text-align: center;
			line-height: 1.1;
			word-break: break-word;
			max-width: 100%;
		}

		@media (max-width: 968px) {
			padding: 0.5rem 0.25rem;

			.stat-value {
				font-size: 1.2rem;
			}

			.stat-label {
				font-size: 0.575rem;
			}
		}
	}

	/* ========== LISTA (4-20) ========== */
	.leaderboard-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.leaderboard-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--color--card-background);
		border-radius: 12px;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		transition: all 0.2s ease;

		&:hover {
			background: var(--color--primary-tint);
			border-color: var(--color--primary);
			transform: translateX(4px);
		}

		@media (max-width: 968px) {
			flex-wrap: wrap;
			gap: 0.75rem;
			padding: 0.875rem 1rem;
		}

		@media (max-width: 480px) {
			padding: 0.75rem 0.75rem;
			gap: 0.5rem;
		}
	}

	.rank-badge {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #6e29e7, #8b5cf6);
		color: white;
		border-radius: 50%;
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.participant-avatar-small {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid rgba(var(--color--text-rgb), 0.15);
		box-shadow: 0 2px 8px rgba(var(--color--text-rgb), 0.1);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.participant-details {
		flex: 1;
		min-width: 0;
	}

	.participant-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.25rem 0;
		text-transform: capitalize;
	}

	.participant-subtitle {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0 0 0.5rem 0;
		text-transform: capitalize;
	}

	.participant-career {
		font-size: 0.8rem;
		color: var(--color--text-shade);
		margin: 0 0 0.5rem 0;
		text-transform: capitalize;
		font-style: italic;
	}

	.participant-social {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
		max-width: 100%;
	}

	.social-link-small {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		color: white;
		transition: all 0.2s ease;
		text-decoration: none;
		flex-shrink: 0;

		&:hover {
			transform: translateY(-2px) scale(1.1);
			box-shadow: 0 6px 12px rgba(var(--color--text-rgb), 0.2);
			filter: brightness(1.1);
		}

		svg {
			width: 14px;
			height: 14px;
		}
	}

	.participant-metrics {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;

		@media (max-width: 968px) {
			width: 100%;
			justify-content: space-around;
		}
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.625rem 1rem;
		background: var(--color--primary-tint);
		border-radius: 8px;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		min-width: 85px;
		transition: all 0.2s ease;

		&:hover {
			background: var(--color--primary-tint);
			border-color: var(--color--primary);
		}

		.metric-value {
			font-size: 1.375rem;
			font-weight: 700;
			color: var(--color--text);
			line-height: 1;
		}

		.metric-label {
			font-size: 0.7rem;
			color: var(--color--text-shade);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-top: 0.25rem;
		}
	}

	/* ========== LOAD MORE BUTTON ========== */
	.load-more-container {
		display: flex;
		justify-content: center;
		padding: 2rem 0;
	}

	.load-more-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
			background: linear-gradient(135deg, #7c3aed, #a855f7);
		}

		&:active {
			transform: translateY(0);
		}

		svg {
			width: 20px;
			height: 20px;
			animation: bounce 2s infinite;
		}
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(4px);
		}
	}
</style>
