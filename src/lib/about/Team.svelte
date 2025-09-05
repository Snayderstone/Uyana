<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import Button from '$lib/components/atoms/Button.svelte';

	// Exportamos la prop para controlar el delay de la animación
	export let animationDelay = 400;

	// Estado para el hover del correo
	let hoveredEmail: string | null = null;

	// Movemos los datos a una constante para mejor mantenibilidad
	const team = [
		{
			name: 'Ing. Robert Arturo Enriquez Reyes, Ph.D.',
			role: 'Docente Tutor',
			email: 'renriquez@uce.edu.ec',
			avatar: '👨‍🏫',
			isTeacher: true,
			skills: ['Investigación', 'Dirección Académica', 'Tutoría'],
			socialLinks: {
				linkedin: 'https://www.linkedin.com/in/robert-enr%C3%ADquez-reyes-3a475425/'
			}
		},
		{
			name: 'Luis Gaona',
			role: 'Desarrollador UYANA',
			email: 'lagaona@uce.edu.ec',
			avatar: '👨‍💻',
			skills: ['Frontend', 'UI/UX', 'Gestión de Proyecto'],
			socialLinks: {
				github: 'https://github.com/Snayderstone',
				linkedin: 'https://www.linkedin.com/in/luis-angel-gaona-cumbicus-42589a221/'
			}
		},
		{
			name: 'Roberth Loaiza',
			role: 'Desarrollador UYANA',
			email: 'reloaiza@uce.edu.ec',
			avatar: '👨‍💻',
			skills: ['Backend', 'API', 'Arquitectura'],
			socialLinks: {
				github: 'https://github.com/RoberthLoaiza',
				linkedin: 'https://www.linkedin.com/in/roberth-loaiza/'
			}
		}
	];
</script>

<div class="team-section" in:fly={{ y: 20, duration: 600, delay: animationDelay }}>
	<h2 class="section-title" in:fade={{ duration: 400, delay: animationDelay }}>Nuestro Equipo</h2>
	<div class="team-grid">
		{#each team as member, i}
			<div
				class="team-card"
				class:is-teacher={member.isTeacher}
				in:fly={{
					y: 20,
					duration: 600,
					delay: animationDelay + i * 100
				}}
			>
				<div class="card-content">
					<div class="avatar-wrapper">
						<div class="avatar">{member.avatar}</div>
						{#if member.isTeacher}
							<div class="teacher-badge">Tutor</div>
						{/if}
					</div>
					<div class="member-info">
						<h3>{member.name}</h3>
						<p class="role">{member.role}</p>
						<div class="skills">
							{#each member.skills as skill}
								<span class="skill-tag">{skill}</span>
							{/each}
						</div>
						<div
							class="contact-container"
							on:mouseenter={() => (hoveredEmail = member.email)}
							on:mouseleave={() => (hoveredEmail = null)}
						>
							<Button
								href="mailto:{member.email}"
								color="primary"
								style="understated"
								class="contact-button"
							>
								<span class="email-icon">✉️</span>
								<span class="email-text">
									{#if hoveredEmail === member.email}
										Enviar correo
									{:else}
										{member.email}
									{/if}
								</span>
							</Button>

							<div class="social-buttons">
								{#if member.socialLinks.github}
									<a
										href={member.socialLinks.github}
										target="_blank"
										rel="noopener noreferrer"
										class="social-button github"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path
												d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
											/>
										</svg>
										<span>GitHub</span>
									</a>
								{/if}
								<a
									href={member.socialLinks.linkedin}
									target="_blank"
									rel="noopener noreferrer"
									class="social-button linkedin"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
										/>
									</svg>
									<span>LinkedIn</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	.team-section {
		margin: 2rem 0;
		overflow: hidden;
	}

	.section-title {
		font-family: var(--font--title);
		font-size: 2rem;
		text-align: center;
		margin-bottom: 3rem;
		color: var(--color--text);
		font-weight: 700;
		letter-spacing: -0.5px;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			bottom: -0.5rem;
			left: 50%;
			transform: translateX(-50%);
			width: 60px;
			height: 3px;
			background: var(--color--primary);
			border-radius: 2px;
		}
	}

	.team-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		padding: 1rem;
	}

	.team-card {
		background: var(--color--card-background);
		border-radius: 1.5rem;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1px solid var(--color--border);
		position: relative;

		&:hover {
			transform: translateY(-5px);
			box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);

			.avatar {
				transform: scale(1.05);
			}

			.skill-tag {
				transform: translateY(-2px);
			}
		}

		&.is-teacher {
			border: 2px solid var(--color--primary);

			.avatar {
				border-color: var(--color--primary);
			}
		}
	}

	.card-content {
		padding: 2rem;
	}

	.avatar-wrapper {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.avatar {
		font-size: 3.5rem;
		background: var(--color--background);
		width: 100px;
		height: 100px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		border: 3px solid var(--color--border);
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.teacher-badge {
		position: absolute;
		top: 0;
		right: 25%;
		background: var(--color--primary);
		color: white;
		padding: 0.3rem 0.8rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		transform: translateY(-50%);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.member-info {
		text-align: center;

		h3 {
			color: var(--color--text);
			font-size: 1.2rem;
			font-weight: 600;
			margin-bottom: 0.5rem;
		}

		.role {
			color: var(--color--text-shade);
			font-size: 0.9rem;
			margin-bottom: 1rem;
			font-weight: 500;
		}
	}

	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.skill-tag {
		background: var(--color--background);
		color: var(--color--text-shade);
		padding: 0.3rem 0.8rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		transition: all 0.3s ease;
		border: 1px solid var(--color--border);

		&:hover {
			background: var(--color--primary);
			color: white;
			border-color: var(--color--primary);
		}
	}

	.contact-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.email-icon {
		transition: transform 0.3s ease;
	}

	.email-text {
		transition: all 0.3s ease;
	}

	.social-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.social-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		background: var(--color--background);
		color: var(--color--text);
		text-decoration: none;
		transition: all 0.3s ease;
		border: 1px solid var(--color--border);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

		svg {
			transition: transform 0.3s ease;
		}

		&.github:hover {
			background: #24292e;
			color: white;
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(36, 41, 46, 0.2);
			border-color: #24292e;

			svg {
				transform: scale(1.1);
			}
		}

		&.linkedin:hover {
			background: #0077b5;
			color: white;
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 119, 181, 0.2);
			border-color: #0077b5;

			svg {
				transform: scale(1.1);
			}
		}
	}

	// Mejoras de responsividad
	@media (max-width: 768px) {
		.team-grid {
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 1.5rem;
			padding: 0.5rem;
		}

		.section-title {
			font-size: 1.8rem;
			margin-bottom: 2rem;
		}

		.card-content {
			padding: 1.5rem;
		}

		.avatar {
			width: 80px;
			height: 80px;
			font-size: 3rem;
		}

		.social-buttons {
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
		}

		.social-button {
			width: 100%;
			max-width: 180px;
		}
	}

	// Optimizaciones de rendimiento
	@media (prefers-reduced-motion: reduce) {
		.team-card,
		.avatar,
		.skill-tag,
		.email-icon,
		.email-text,
		.social-button,
		.social-button svg {
			transition: none;
		}

		.team-card:hover {
			.avatar,
			.skill-tag {
				transform: none;
			}
		}

		.social-button:hover svg {
			transform: none;
		}
	}
</style>
