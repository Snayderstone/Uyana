<script lang="ts">
	import { page } from '$app/stores';

	const lastUpdated = '30 de enero de 2026';
	const version = '1.0';
</script>

<svelte:head>
	<title>Términos y Condiciones - SIGPI UCE</title>
	<meta
		name="description"
		content="Términos y condiciones de uso de la plataforma SIGPI para la visualización de proyectos de investigación de la Universidad Central del Ecuador"
	/>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="legal-page">
	<div class="legal-container">
		<header class="legal-header">
			<h1>Términos y Condiciones de Uso</h1>
			<p class="subtitle">Plataforma SIGPI - Universidad Central del Ecuador</p>
			<div class="metadata">
				<span><strong>Versión:</strong> {version}</span>
				<span><strong>Última actualización:</strong> {lastUpdated}</span>
			</div>
		</header>

		<div class="legal-content">
			<section id="introduccion">
				<h2>1. Introducción y Aceptación</h2>
				<p>
					Bienvenido a SIGPI, la plataforma web de georreferenciación y visualización interactiva de
					proyectos de investigación de la Universidad Central del Ecuador (en adelante, "UCE" o "la
					Universidad").
				</p>
				<p>
					Al acceder y utilizar esta plataforma, usted acepta estar sujeto a estos Términos y
					Condiciones, así como a todas las leyes y regulaciones aplicables, incluyendo la Ley
					Orgánica de Protección de Datos Personales de Ecuador. Si no está de acuerdo con alguno de
					estos términos, no debe utilizar esta plataforma.
				</p>
			</section>

			<section id="objeto">
				<h2>2. Objeto y Alcance de la Plataforma</h2>
				<h3>2.1 Propósito</h3>
				<p>
					SIGPI tiene como propósito facilitar el análisis, fortalecer la toma de decisiones
					estratégicas y mejorar la transparencia institucional mediante la visualización de datos
					de proyectos de investigación realizados en la UCE durante el período 2011-2025.
				</p>

				<h3>2.2 Funcionalidades</h3>
				<p>La plataforma ofrece:</p>
				<ul>
					<li>Mapas coropléticos de distribución geográfica de proyectos</li>
					<li>Dashboards dinámicos con estadísticas e indicadores</li>
					<li>Filtros analíticos por facultad, línea de investigación, año, etc.</li>
					<li>Directorio de investigadores acreditados</li>
					<li>Información detallada de proyectos de investigación</li>
				</ul>

				<h3>2.3 Naturaleza de los Datos</h3>
				<p>
					Los datos visualizados en SIGPI son de propiedad exclusiva de la <strong
						>Dirección de Investigación de la Universidad Central del Ecuador</strong
					> y están protegidos por las leyes de propiedad intelectual y protección de datos personales
					vigentes en Ecuador.
				</p>
			</section>

			<section id="uso-academico">
				<h2>3. Uso Académico y No Comercial</h2>
				<h3>3.1 Finalidad Exclusivamente Académica</h3>
				<p>
					El acceso a los datos de SIGPI está permitido <strong
						>únicamente con fines académicos, educativos y de investigación científica</strong
					>. Queda expresamente prohibido cualquier uso comercial, publicitario o con ánimo de
					lucro.
				</p>

				<h3>3.2 Usos Permitidos</h3>
				<ul>
					<li>Consulta y análisis con fines de investigación académica</li>
					<li>Elaboración de trabajos de grado, tesis o publicaciones científicas</li>
					<li>Estudios estadísticos y análisis de tendencias en investigación</li>
					<li>Colaboración académica interinstitucional</li>
				</ul>

				<h3>3.3 Usos Prohibidos</h3>
				<ul>
					<li>Comercialización de los datos o información derivada</li>
					<li>Uso para publicidad o marketing comercial</li>
					<li>Reventa, licenciamiento o cesión de los datos a terceros</li>
					<li>Uso para entrenar modelos de inteligencia artificial comerciales</li>
					<li>Recopilación masiva automatizada (web scraping) sin autorización</li>
					<li>Modificación, alteración o tergiversación de los datos originales</li>
				</ul>
			</section>

			<section id="responsabilidades">
				<h2>4. Responsabilidades del Usuario</h2>
				<h3>4.1 Obligaciones Generales</h3>
				<p>El usuario se compromete a:</p>
				<ul>
					<li>Utilizar la plataforma de manera ética y responsable</li>
					<li>Respetar los derechos de propiedad intelectual de la UCE</li>
					<li>No intentar acceder a áreas restringidas o vulnerar la seguridad del sistema</li>
					<li>Citar adecuadamente la fuente cuando utilice los datos en publicaciones</li>
					<li>Mantener la confidencialidad de cualquier dato personal que pueda visualizar</li>
				</ul>

				<h3>4.2 Citación Apropiada</h3>
				<p>
					Si utiliza datos de SIGPI en publicaciones académicas, debe citar de la siguiente manera:
				</p>
				<blockquote>
					Universidad Central del Ecuador, Dirección de Investigación. (2026). SIGPI: Plataforma de
					Georreferenciación de Proyectos de Investigación. Quito, Ecuador. Disponible en: [URL de
					la plataforma]
				</blockquote>
			</section>

			<section id="propiedad-intelectual">
				<h2>5. Propiedad Intelectual</h2>
				<h3>5.1 Derechos de la UCE</h3>
				<p>
					Todos los contenidos de la plataforma SIGPI, incluyendo pero no limitado a textos,
					gráficos, bases de datos, código fuente, diseño visual y estructura, son propiedad de la
					Universidad Central del Ecuador o de sus respectivos titulares.
				</p>

				<h3>5.2 Licencia de Uso</h3>
				<p>
					La UCE otorga a los usuarios una licencia limitada, no exclusiva, intransferible y
					revocable para acceder y consultar los datos con fines académicos. Esta licencia no
					implica cesión de derechos de propiedad intelectual.
				</p>
			</section>

			<section id="limitacion-responsabilidad">
				<h2>6. Limitación de Responsabilidad</h2>
				<h3>6.1 Exactitud de los Datos</h3>
				<p>
					La UCE hace esfuerzos razonables para garantizar la exactitud y actualización de los datos
					presentados. Sin embargo, no garantiza que la información esté completamente libre de
					errores u omisiones. Los datos se proporcionan "tal cual" sin garantías de ningún tipo.
				</p>

				<h3>6.2 Exclusión de Responsabilidad</h3>
				<p>La Universidad Central del Ecuador no será responsable por:</p>
				<ul>
					<li>Errores, inexactitudes u omisiones en los datos presentados</li>
					<li>Decisiones tomadas en base a la información consultada</li>
					<li>Daños directos o indirectos derivados del uso de la plataforma</li>
					<li>Interrupciones temporales del servicio por mantenimiento o causas técnicas</li>
					<li>Uso inadecuado o no autorizado de los datos por parte de terceros</li>
				</ul>

				<h3>6.3 Uso Bajo Propio Riesgo</h3>
				<p>
					El usuario reconoce y acepta que utiliza la plataforma bajo su propio riesgo y
					responsabilidad.
				</p>
			</section>

			<section id="disponibilidad">
				<h2>7. Disponibilidad del Servicio</h2>
				<p>
					La UCE se reserva el derecho de modificar, suspender o discontinuar la plataforma SIGPI,
					temporal o permanentemente, sin previo aviso. La Universidad no será responsable por
					cualquier modificación, suspensión o discontinuación del servicio.
				</p>
			</section>

			<section id="confidencialidad">
				<h2>8. Confidencialidad y Seguridad</h2>
				<p>
					La plataforma implementa medidas técnicas y organizativas apropiadas para proteger la
					información. Sin embargo, ningún sistema es completamente seguro. El usuario debe tomar
					precauciones razonables al utilizar internet.
				</p>
			</section>

			<section id="legislacion">
				<h2>9. Legislación Aplicable y Jurisdicción</h2>
				<h3>9.1 Ley Aplicable</h3>
				<p>
					Estos Términos y Condiciones se rigen por la legislación de la República del Ecuador,
					particularmente:
				</p>
				<ul>
					<li>Ley Orgánica de Protección de Datos Personales</li>
					<li>Ley de Propiedad Intelectual</li>
					<li>Código Orgánico de la Economía Social de los Conocimientos</li>
				</ul>

				<h3>9.2 Jurisdicción</h3>
				<p>
					Cualquier controversia derivada del uso de esta plataforma será resuelta por los
					tribunales competentes de la ciudad de Quito, Ecuador.
				</p>
			</section>

			<section id="modificaciones">
				<h2>10. Modificaciones a los Términos</h2>
				<p>
					La UCE se reserva el derecho de modificar estos Términos y Condiciones en cualquier
					momento. Las modificaciones entrarán en vigencia inmediatamente después de su publicación
					en la plataforma. El uso continuado de SIGPI después de la publicación de cambios
					constituye su aceptación de dichas modificaciones.
				</p>
			</section>

			<section id="contacto">
				<h2>11. Contacto</h2>
				<p>
					Para consultas relacionadas con estos Términos y Condiciones o el uso de la plataforma,
					puede contactar a:
				</p>
				<address>
					<strong>Dirección de Investigación</strong><br />
					Universidad Central del Ecuador<br />
					Ciudadela Universitaria, Av. América<br />
					Quito, Ecuador<br />
					Correo electrónico: investigacion@uce.edu.ec
				</address>
			</section>

			<section id="aceptacion">
				<h2>12. Aceptación de los Términos</h2>
				<p>Al hacer clic en "Aceptar" en el formulario de consentimiento, usted declara que:</p>
				<ul>
					<li>Ha leído y comprendido estos Términos y Condiciones</li>
					<li>Acepta estar legalmente vinculado por ellos</li>
					<li>Utilizará la plataforma exclusivamente con fines académicos</li>
					<li>Respetará los derechos de propiedad intelectual de la UCE</li>
					<li>Cumplirá con todas las restricciones de uso establecidas</li>
				</ul>
			</section>
		</div>

		<footer class="legal-footer">
			<p>© 2026 Universidad Central del Ecuador - Todos los derechos reservados</p>
			<p>
				<a href="/privacidad">Política de Privacidad</a> |
				<a href="/">Volver al inicio</a>
			</p>
		</footer>
	</div>
</div>

<style lang="scss">
	.legal-page {
		min-height: 100vh;
		background-color: #f9fafb;
		padding: 2rem 1rem;
	}

	.legal-container {
		max-width: 900px;
		margin: 0 auto;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.legal-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 3rem 2rem;
		text-align: center;

		h1 {
			font-size: 2.5rem;
			margin: 0 0 0.5rem;
			font-weight: 700;
		}

		.subtitle {
			font-size: 1.2rem;
			margin: 0 0 1rem;
			opacity: 0.95;
		}

		.metadata {
			display: flex;
			justify-content: center;
			gap: 2rem;
			font-size: 0.9rem;
			margin-top: 1.5rem;

			span {
				background: rgba(255, 255, 255, 0.2);
				padding: 0.5rem 1rem;
				border-radius: 6px;
			}
		}
	}

	.legal-content {
		padding: 3rem 2rem;
		line-height: 1.8;
		color: #374151;

		section {
			margin-bottom: 3rem;

			&:last-child {
				margin-bottom: 0;
			}
		}

		h2 {
			color: #1f2937;
			font-size: 1.75rem;
			margin: 2rem 0 1rem;
			padding-bottom: 0.5rem;
			border-bottom: 2px solid #e5e7eb;
			font-weight: 700;
		}

		h3 {
			color: #374151;
			font-size: 1.25rem;
			margin: 1.5rem 0 0.75rem;
			font-weight: 600;
		}

		p {
			margin: 1rem 0;
		}

		ul {
			margin: 1rem 0;
			padding-left: 2rem;

			li {
				margin: 0.5rem 0;
			}
		}

		strong {
			color: #1f2937;
			font-weight: 600;
		}

		blockquote {
			background: #f3f4f6;
			border-left: 4px solid #667eea;
			padding: 1rem 1.5rem;
			margin: 1.5rem 0;
			font-style: italic;
			color: #4b5563;
		}

		address {
			font-style: normal;
			background: #f9fafb;
			padding: 1.5rem;
			border-radius: 8px;
			border: 1px solid #e5e7eb;
			line-height: 1.8;
		}
	}

	.legal-footer {
		background: #f9fafb;
		padding: 2rem;
		text-align: center;
		border-top: 1px solid #e5e7eb;
		color: #6b7280;

		p {
			margin: 0.5rem 0;
		}

		a {
			color: #667eea;
			text-decoration: none;
			font-weight: 500;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	@media (max-width: 768px) {
		.legal-header {
			padding: 2rem 1.5rem;

			h1 {
				font-size: 1.75rem;
			}

			.subtitle {
				font-size: 1rem;
			}

			.metadata {
				flex-direction: column;
				gap: 0.5rem;
			}
		}

		.legal-content {
			padding: 2rem 1.5rem;

			h2 {
				font-size: 1.5rem;
			}

			h3 {
				font-size: 1.1rem;
			}
		}
	}
</style>
