<script lang="ts">
	const lastUpdated = '30 de enero de 2026';
	const version = '1.0';
</script>

<svelte:head>
	<title>Política de Privacidad - SIGPI UCE</title>
	<meta
		name="description"
		content="Política de privacidad y protección de datos personales de la plataforma SIGPI - Universidad Central del Ecuador"
	/>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="legal-page">
	<div class="legal-container">
		<header class="legal-header">
			<h1>Política de Privacidad</h1>
			<p class="subtitle">Plataforma SIGPI - Universidad Central del Ecuador</p>
			<div class="metadata">
				<span><strong>Versión:</strong> {version}</span>
				<span><strong>Última actualización:</strong> {lastUpdated}</span>
			</div>
		</header>

		<div class="legal-content">
			<section id="introduccion">
				<h2>1. Introducción</h2>
				<p>
					La Universidad Central del Ecuador (en adelante, "UCE" o "la Universidad"), a través de su
					Dirección de Investigación, es responsable de la plataforma SIGPI y del tratamiento de los
					datos personales recopilados mediante la misma.
				</p>
				<p>
					Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos la
					información personal de los usuarios, en cumplimiento de la <strong
						>Ley Orgánica de Protección de Datos Personales de Ecuador</strong
					> y demás normativa aplicable.
				</p>
			</section>

			<section id="responsable">
				<h2>2. Responsable del Tratamiento</h2>
				<address>
					<strong>Razón Social:</strong> Universidad Central del Ecuador<br />
					<strong>Dependencia:</strong> Dirección de Investigación<br />
					<strong>Domicilio:</strong> Ciudadela Universitaria, Av. América, Quito, Ecuador<br />
					<strong>Correo electrónico:</strong> investigacion@uce.edu.ec<br />
					<strong>Teléfono:</strong> +593 2 2904 000
				</address>
			</section>

			<section id="datos-recopilados">
				<h2>3. Datos Personales Recopilados</h2>
				<h3>3.1 Información de Acceso a la Plataforma</h3>
				<p>Cuando accede a SIGPI, recopilamos automáticamente:</p>
				<ul>
					<li><strong>Dirección IP:</strong> Para fines de seguridad y auditoría</li>
					<li><strong>Fecha y hora de acceso:</strong> Para registro de consentimientos</li>
					<li>
						<strong>User-Agent (navegador y sistema operativo):</strong> Para compatibilidad técnica
					</li>
					<li><strong>Token de sesión único:</strong> Para rastrear aceptaciones de términos</li>
				</ul>

				<h3>3.2 Datos de Consentimiento</h3>
				<p>Al aceptar los términos de uso, registramos:</p>
				<ul>
					<li>Confirmación de aceptación de Términos y Condiciones</li>
					<li>Confirmación de aceptación de Política de Privacidad</li>
					<li>Confirmación de uso exclusivamente académico</li>
					<li>Versión de los documentos aceptados</li>
					<li>Timestamp de la aceptación</li>
				</ul>

				<h3>3.3 Datos de Investigadores (Públicos)</h3>
				<p>
					La plataforma muestra información pública de investigadores acreditados de la UCE,
					incluyendo nombres, facultades y líneas de investigación. Esta información proviene de
					registros institucionales oficiales y se considera de dominio público en el contexto
					académico.
				</p>

				<h3>3.4 Datos No Recopilados</h3>
				<p>SIGPI NO recopila:</p>
				<ul>
					<li>Datos de identificación personal detallados (cédulas, pasaportes)</li>
					<li>Información financiera o bancaria</li>
					<li>Datos sensibles (origen étnico, opiniones políticas, salud, etc.)</li>
					<li>Información de menores de edad</li>
				</ul>
			</section>

			<section id="finalidad">
				<h2>4. Finalidad del Tratamiento de Datos</h2>
				<h3>4.1 Finalidades Principales</h3>
				<p>Los datos personales recopilados se utilizan para:</p>
				<ul>
					<li>
						<strong>Registro de consentimientos:</strong> Documentar la aceptación de términos legales
					</li>
					<li>
						<strong>Seguridad del sistema:</strong> Prevenir accesos no autorizados y ataques automatizados
					</li>
					<li>
						<strong>Auditoría y cumplimiento:</strong> Verificar el uso apropiado de los datos institucionales
					</li>
					<li>
						<strong>Mejora del servicio:</strong> Analizar patrones de uso para optimizar la plataforma
					</li>
					<li>
						<strong>Transparencia institucional:</strong> Cumplir con requisitos de la Dirección de Investigación
					</li>
				</ul>

				<h3>4.2 Base Legal del Tratamiento</h3>
				<p>El tratamiento de datos se fundamenta en:</p>
				<ul>
					<li><strong>Consentimiento explícito:</strong> Otorgado al aceptar estos términos</li>
					<li>
						<strong>Interés legítimo institucional:</strong> Protección de información académica
					</li>
					<li>
						<strong>Cumplimiento de obligaciones legales:</strong> Normativa de protección de datos
					</li>
				</ul>
			</section>

			<section id="almacenamiento">
				<h2>5. Almacenamiento y Conservación</h2>
				<h3>5.1 Ubicación de los Datos</h3>
				<p>
					Los datos se almacenan en servidores seguros proporcionados por <strong>Supabase</strong>,
					un proveedor de servicios cloud que cumple con estándares internacionales de seguridad
					(SOC 2 Type II, ISO 27001).
				</p>

				<h3>5.2 Período de Conservación</h3>
				<ul>
					<li>
						<strong>Datos de consentimiento:</strong> Se conservan durante la vigencia de la plataforma
						más 5 años adicionales para fines de auditoría
					</li>
					<li><strong>Logs de acceso:</strong> Se mantienen por un máximo de 12 meses</li>
					<li>
						<strong>Datos de sesión temporal:</strong> Se eliminan automáticamente al cerrar sesión
					</li>
				</ul>

				<h3>5.3 Medidas de Seguridad</h3>
				<p>Implementamos medidas técnicas y organizativas apropiadas:</p>
				<ul>
					<li>Cifrado de datos en tránsito (HTTPS/TLS)</li>
					<li>Cifrado de datos en reposo</li>
					<li>Control de acceso basado en roles (RLS - Row Level Security)</li>
					<li>Auditorías periódicas de seguridad</li>
					<li>Copias de seguridad automatizadas</li>
					<li>Monitoreo de accesos no autorizados</li>
				</ul>
			</section>

			<section id="comparticion">
				<h2>6. Compartición de Datos</h2>
				<h3>6.1 No Compartimos con Terceros Comerciales</h3>
				<p>
					La UCE NO vende, alquila ni comparte datos personales con terceros con fines comerciales o
					publicitarios.
				</p>

				<h3>6.2 Divulgación Limitada</h3>
				<p>Los datos pueden compartirse únicamente en los siguientes casos:</p>
				<ul>
					<li>
						<strong>Autoridades competentes:</strong> Cuando sea requerido por orden judicial o legal
					</li>
					<li>
						<strong>Proveedores de servicios técnicos:</strong> Supabase (hosting de base de datos) bajo
						acuerdos de confidencialidad
					</li>
					<li>
						<strong>Auditorías internas:</strong> Personal autorizado de la UCE para supervisión institucional
					</li>
				</ul>

				<h3>6.3 Transferencias Internacionales</h3>
				<p>
					Los datos pueden estar alojados en servidores ubicados fuera de Ecuador. En tal caso, se
					garantiza que el proveedor cumple con estándares adecuados de protección de datos.
				</p>
			</section>

			<section id="derechos">
				<h2>7. Derechos del Titular de los Datos</h2>
				<p>
					Conforme a la Ley Orgánica de Protección de Datos Personales de Ecuador, usted tiene
					derecho a:
				</p>

				<h3>7.1 Derecho de Acceso</h3>
				<p>Conocer qué datos personales suyos están siendo tratados por la UCE.</p>

				<h3>7.2 Derecho de Rectificación</h3>
				<p>Solicitar la corrección de datos inexactos o incompletos.</p>

				<h3>7.3 Derecho de Supresión ("Derecho al Olvido")</h3>
				<p>Solicitar la eliminación de sus datos personales cuando ya no sean necesarios.</p>

				<h3>7.4 Derecho de Oposición</h3>
				<p>Oponerse al tratamiento de sus datos en determinadas circunstancias.</p>

				<h3>7.5 Derecho a la Portabilidad</h3>
				<p>Recibir sus datos en un formato estructurado y de uso común.</p>

				<h3>7.6 Derecho a Revocar el Consentimiento</h3>
				<p>
					Retirar el consentimiento en cualquier momento. Esto impedirá el acceso futuro a la
					plataforma.
				</p>

				<h3>7.7 Ejercicio de Derechos</h3>
				<p>Para ejercer cualquiera de estos derechos, envíe un correo a:</p>
				<p><strong>investigacion@uce.edu.ec</strong></p>
				<p>
					Incluya su nombre completo, descripción de su solicitud y documento de identidad.
					Responderemos en un plazo máximo de 15 días hábiles.
				</p>
			</section>

			<section id="cookies">
				<h2>8. Cookies y Tecnologías Similares</h2>
				<h3>8.1 Uso de Cookies</h3>
				<p>SIGPI utiliza cookies y almacenamiento local (localStorage) para:</p>
				<ul>
					<li>
						<strong>Cookies de sesión:</strong> Mantener su estado de autenticación (solo área administrativa)
					</li>
					<li>
						<strong>localStorage:</strong> Guardar su consentimiento para evitar mostrar el CAPTCHA repetidamente
					</li>
					<li>
						<strong>Cookies de CAPTCHA:</strong> hCaptcha utiliza cookies para verificación anti-bot
					</li>
				</ul>

				<h3>8.2 Cookies de Terceros</h3>
				<p>
					La plataforma utiliza hCaptcha (hcaptcha.com) para protección contra bots. Consulte la
					política de privacidad de hCaptcha para más información.
				</p>

				<h3>8.3 Control de Cookies</h3>
				<p>
					Puede eliminar las cookies y el almacenamiento local desde la configuración de su
					navegador. Sin embargo, esto requerirá volver a completar el CAPTCHA en su próxima visita.
				</p>
			</section>

			<section id="menores">
				<h2>9. Menores de Edad</h2>
				<p>
					SIGPI no está dirigida a menores de 18 años. No recopilamos intencionalmente información
					personal de menores. Si un padre o tutor descubre que su hijo ha proporcionado información
					personal, debe contactarnos para su eliminación inmediata.
				</p>
			</section>

			<section id="cambios">
				<h2>10. Cambios a la Política de Privacidad</h2>
				<p>
					La UCE se reserva el derecho de modificar esta Política de Privacidad en cualquier
					momento. Los cambios se publicarán en esta página con la fecha de actualización
					correspondiente.
				</p>
				<p>
					Si los cambios son significativos, se requerirá una nueva aceptación explícita al acceder
					a la plataforma.
				</p>
			</section>

			<section id="incidentes">
				<h2>11. Notificación de Incidentes de Seguridad</h2>
				<p>
					En caso de una violación de seguridad que afecte datos personales, la UCE notificará a los
					usuarios afectados y a las autoridades competentes dentro de los plazos establecidos por
					la ley.
				</p>
			</section>

			<section id="autoridad">
				<h2>12. Autoridad de Control</h2>
				<p>
					Si considera que el tratamiento de sus datos personales vulnera sus derechos, puede
					presentar una reclamación ante la <strong
						>Autoridad de Protección de Datos de Ecuador</strong
					> o la autoridad competente designada según la normativa vigente.
				</p>
			</section>

			<section id="contacto">
				<h2>13. Contacto</h2>
				<p>
					Para cualquier consulta, solicitud o reclamo relacionado con la privacidad de sus datos,
					puede contactarnos:
				</p>
				<address>
					<strong>Dirección de Investigación</strong><br />
					Universidad Central del Ecuador<br />
					Ciudadela Universitaria, Av. América<br />
					Quito, Ecuador<br />
					<strong>Correo electrónico:</strong> investigacion@uce.edu.ec<br />
					<strong>Teléfono:</strong> +593 2 2904 000
				</address>
			</section>

			<section id="aceptacion">
				<h2>14. Aceptación de la Política</h2>
				<p>Al hacer clic en "Aceptar" en el formulario de consentimiento, usted confirma que:</p>
				<ul>
					<li>Ha leído y comprendido esta Política de Privacidad</li>
					<li>
						Otorga su consentimiento libre, informado e inequívoco para el tratamiento de sus datos
					</li>
					<li>Entiende sus derechos como titular de datos personales</li>
					<li>Acepta el uso de cookies y tecnologías similares según se describe</li>
				</ul>
			</section>

			<div class="important-notice">
				<h3>⚖️ Cumplimiento Legal</h3>
				<p>
					Esta Política de Privacidad cumple con la <strong
						>Ley Orgánica de Protección de Datos Personales de Ecuador</strong
					> y demás normativa aplicable en materia de protección de datos, privacidad y derechos fundamentales.
				</p>
			</div>
		</div>

		<footer class="legal-footer">
			<p>© 2026 Universidad Central del Ecuador - Todos los derechos reservados</p>
			<p>
				<a href="/terminos">Términos y Condiciones</a> |
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
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

		address {
			font-style: normal;
			background: #f9fafb;
			padding: 1.5rem;
			border-radius: 8px;
			border: 1px solid #e5e7eb;
			line-height: 1.8;
		}

		.important-notice {
			background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
			border: 2px solid #f59e0b;
			border-radius: 12px;
			padding: 2rem;
			margin-top: 3rem;

			h3 {
				color: #92400e;
				margin-top: 0;
				font-size: 1.3rem;
			}

			p {
				color: #78350f;
				margin-bottom: 0;
			}
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
			color: #10b981;
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
