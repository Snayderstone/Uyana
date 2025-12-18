/**
 * Admin Module - Reports Service
 * -------------------------------
 * Servicio para generación de informes de proyectos en PDF y DOCX.
 */

import PDFDocument from 'pdfkit';
import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	HeadingLevel,
	AlignmentType,
	Table,
	TableRow,
	TableCell,
	WidthType
} from 'docx';
import { AdminProjectsService } from './projects/projects.service';
import type { ProyectoResponseDTO } from '$lib/models/admin';

export const AdminReportsService = {
	/**
	 * Generar informe de un proyecto en PDF
	 */
	async generateProjectPDF(projectId: number): Promise<Buffer> {
		// Obtener datos del proyecto
		const project = await AdminProjectsService.getProjectById(projectId);

		if (!project) {
			throw new Error('Proyecto no encontrado');
		}

		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margins: {
						top: 50,
						bottom: 50,
						left: 50,
						right: 50
					}
				});

				const chunks: Buffer[] = [];

				// Capturar el contenido del PDF
				doc.on('data', (chunk) => chunks.push(chunk));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', reject);

				// --- CONTENIDO DEL PDF ---

				// Encabezado
				doc.fontSize(20).font('Helvetica-Bold').text('INFORME DE PROYECTO DE INVESTIGACIÓN', {
					align: 'center'
				});
				doc.moveDown();

				// Información básica
				doc.fontSize(16).font('Helvetica-Bold').text('1. INFORMACIÓN GENERAL', {
					underline: true
				});
				doc.moveDown(0.5);

				doc.fontSize(12).font('Helvetica-Bold').text('Código: ', { continued: true });
				doc.font('Helvetica').text(project.codigo);

				doc.font('Helvetica-Bold').text('Título: ', { continued: true });
				doc.font('Helvetica').text(project.titulo);

				doc.font('Helvetica-Bold').text('Estado: ', { continued: true });
				doc.font('Helvetica').text(project.estado.nombre);

				doc.font('Helvetica-Bold').text('Para SIIES: ', { continued: true });
				doc.font('Helvetica').text(project.para_siies ? 'Sí' : 'No');

				doc.moveDown();

				// Fechas y duración
				doc.fontSize(16).font('Helvetica-Bold').text('2. CRONOGRAMA', {
					underline: true
				});
				doc.moveDown(0.5);

				doc
					.fontSize(12)
					.font('Helvetica-Bold')
					.text('Fecha inicio planeada: ', { continued: true });
				doc
					.font('Helvetica')
					.text(new Date(project.fecha_inicio_planeada).toLocaleDateString('es-ES'));

				doc.font('Helvetica-Bold').text('Fecha fin planeada: ', { continued: true });
				doc
					.font('Helvetica')
					.text(new Date(project.fecha_fin_planeada).toLocaleDateString('es-ES'));

				if (project.fecha_fin_real) {
					doc.font('Helvetica-Bold').text('Fecha fin real: ', { continued: true });
					doc.font('Helvetica').text(new Date(project.fecha_fin_real).toLocaleDateString('es-ES'));
				}

				doc.font('Helvetica-Bold').text('Duración: ', { continued: true });
				doc.font('Helvetica').text(`${project.cantidad_meses} meses`);

				doc.font('Helvetica-Bold').text('Porcentaje de avance: ', { continued: true });
				doc.font('Helvetica').text(`${project.porcentaje_avance}%`);

				doc.moveDown();

				// Clasificación
				doc.fontSize(16).font('Helvetica-Bold').text('3. CLASIFICACIÓN', {
					underline: true
				});
				doc.moveDown(0.5);

				doc.fontSize(12).font('Helvetica-Bold').text('Tipos: ', { continued: true });
				doc.font('Helvetica').text(project.tipos.map((t) => t.nombre).join(', '));

				doc.font('Helvetica-Bold').text('Áreas de conocimiento: ', { continued: true });
				doc.font('Helvetica').text(project.areas_conocimiento.map((a) => a.nombre).join(', '));

				doc.font('Helvetica-Bold').text('Líneas de investigación: ', { continued: true });
				doc.font('Helvetica').text(project.lineas_investigacion.map((l) => l.nombre).join(', '));

				doc.moveDown();

				// Objetivo
				doc.fontSize(16).font('Helvetica-Bold').text('4. OBJETIVO', {
					underline: true
				});
				doc.moveDown(0.5);
				doc.fontSize(12).font('Helvetica').text(project.objetivo, {
					align: 'justify'
				});
				doc.moveDown();

				// Impactos
				doc.fontSize(16).font('Helvetica-Bold').text('5. IMPACTOS', {
					underline: true
				});
				doc.moveDown(0.5);

				doc.fontSize(12).font('Helvetica-Bold').text('Científico:');
				doc.font('Helvetica').text(project.impacto_cientifico, { align: 'justify' });
				doc.moveDown(0.5);

				doc.font('Helvetica-Bold').text('Económico:');
				doc.font('Helvetica').text(project.impacto_economico, { align: 'justify' });
				doc.moveDown(0.5);

				doc.font('Helvetica-Bold').text('Social:');
				doc.font('Helvetica').text(project.impacto_social, { align: 'justify' });
				doc.moveDown(0.5);

				doc.font('Helvetica-Bold').text('Otros:');
				doc.font('Helvetica').text(project.otros_impactos, { align: 'justify' });
				doc.moveDown();

				// Presupuesto
				doc.fontSize(16).font('Helvetica-Bold').text('6. PRESUPUESTO', {
					underline: true
				});
				doc.moveDown(0.5);

				doc.fontSize(12).font('Helvetica-Bold').text('Monto total: ', { continued: true });
				doc.font('Helvetica').text(`$${project.monto_presupuesto_total.toFixed(2)}`);

				doc.font('Helvetica-Bold').text('Fuentes de financiamiento: ', { continued: true });
				doc.font('Helvetica').text(project.fuentes_financiamiento.map((f) => f.nombre).join(', '));

				doc.font('Helvetica-Bold').text('Requiere aval: ', { continued: true });
				doc.font('Helvetica').text(project.requiere_aval ? 'Sí' : 'No');

				doc.moveDown();

				// Instituciones
				doc.fontSize(16).font('Helvetica-Bold').text('7. INSTITUCIONES PARTICIPANTES', {
					underline: true
				});
				doc.moveDown(0.5);

				project.instituciones.forEach((inst, index) => {
					doc
						.fontSize(12)
						.font('Helvetica')
						.text(`${index + 1}. ${inst.nombre}${inst.sigla ? ` (${inst.sigla})` : ''}`);
				});

				doc.moveDown();

				// Participantes
				if (project.participantes && project.participantes.length > 0) {
					doc.fontSize(16).font('Helvetica-Bold').text('8. EQUIPO DE INVESTIGACIÓN', {
						underline: true
					});
					doc.moveDown(0.5);

					project.participantes.forEach((part, index) => {
						doc
							.fontSize(12)
							.font('Helvetica-Bold')
							.text(`${index + 1}. ${part.nombre}`);
						doc.font('Helvetica').text(`   Email: ${part.email}`);
						doc.text(`   Cargo: ${part.cargo}`);
						doc.text(`   Régimen: ${part.regimen_dedicacion}`);
						doc.moveDown(0.3);
					});
				}

				// Pie de página
				doc
					.fontSize(10)
					.font('Helvetica')
					.text(`\nInforme generado el ${new Date().toLocaleString('es-ES')}`, {
						align: 'center'
					});

				// Finalizar el documento
				doc.end();
			} catch (error) {
				reject(error);
			}
		});
	},

	/**
	 * Generar informe de un proyecto en DOCX
	 */
	async generateProjectDOCX(projectId: number): Promise<Buffer> {
		// Obtener datos del proyecto
		const project = await AdminProjectsService.getProjectById(projectId);

		if (!project) {
			throw new Error('Proyecto no encontrado');
		}

		// Crear documento
		const doc = new Document({
			sections: [
				{
					properties: {},
					children: [
						// Título
						new Paragraph({
							text: 'INFORME DE PROYECTO DE INVESTIGACIÓN',
							heading: HeadingLevel.TITLE,
							alignment: AlignmentType.CENTER,
							spacing: {
								after: 400
							}
						}),

						// 1. Información General
						new Paragraph({
							text: '1. INFORMACIÓN GENERAL',
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 200, after: 200 }
						}),

						new Paragraph({
							children: [new TextRun({ text: 'Código: ', bold: true }), new TextRun(project.codigo)]
						}),

						new Paragraph({
							children: [new TextRun({ text: 'Título: ', bold: true }), new TextRun(project.titulo)]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Estado: ', bold: true }),
								new TextRun(project.estado.nombre)
							]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Para SIIES: ', bold: true }),
								new TextRun(project.para_siies ? 'Sí' : 'No')
							]
						}),

						// 2. Cronograma
						new Paragraph({
							text: '2. CRONOGRAMA',
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 400, after: 200 }
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Fecha inicio planeada: ', bold: true }),
								new TextRun(new Date(project.fecha_inicio_planeada).toLocaleDateString('es-ES'))
							]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Fecha fin planeada: ', bold: true }),
								new TextRun(new Date(project.fecha_fin_planeada).toLocaleDateString('es-ES'))
							]
						}),

						...(project.fecha_fin_real
							? [
									new Paragraph({
										children: [
											new TextRun({ text: 'Fecha fin real: ', bold: true }),
											new TextRun(new Date(project.fecha_fin_real).toLocaleDateString('es-ES'))
										]
									})
							  ]
							: []),

						new Paragraph({
							children: [
								new TextRun({ text: 'Duración: ', bold: true }),
								new TextRun(`${project.cantidad_meses} meses`)
							]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Porcentaje de avance: ', bold: true }),
								new TextRun(`${project.porcentaje_avance}%`)
							]
						}),

						// 3. Clasificación
						new Paragraph({
							text: '3. CLASIFICACIÓN',
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 400, after: 200 }
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Tipos: ', bold: true }),
								new TextRun(project.tipos.map((t) => t.nombre).join(', '))
							]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Áreas de conocimiento: ', bold: true }),
								new TextRun(project.areas_conocimiento.map((a) => a.nombre).join(', '))
							]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Líneas de investigación: ', bold: true }),
								new TextRun(project.lineas_investigacion.map((l) => l.nombre).join(', '))
							]
						}),

						// 4. Objetivo
						new Paragraph({
							text: '4. OBJETIVO',
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 400, after: 200 }
						}),

						new Paragraph({
							text: project.objetivo,
							alignment: AlignmentType.JUSTIFIED
						}),

						// 5. Impactos
						new Paragraph({
							text: '5. IMPACTOS',
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 400, after: 200 }
						}),

						new Paragraph({
							children: [new TextRun({ text: 'Científico:', bold: true })]
						}),
						new Paragraph({
							text: project.impacto_cientifico,
							alignment: AlignmentType.JUSTIFIED
						}),

						new Paragraph({
							children: [new TextRun({ text: 'Económico:', bold: true })],
							spacing: { before: 200 }
						}),
						new Paragraph({
							text: project.impacto_economico,
							alignment: AlignmentType.JUSTIFIED
						}),

						new Paragraph({
							children: [new TextRun({ text: 'Social:', bold: true })],
							spacing: { before: 200 }
						}),
						new Paragraph({
							text: project.impacto_social,
							alignment: AlignmentType.JUSTIFIED
						}),

						new Paragraph({
							children: [new TextRun({ text: 'Otros:', bold: true })],
							spacing: { before: 200 }
						}),
						new Paragraph({
							text: project.otros_impactos,
							alignment: AlignmentType.JUSTIFIED
						}),

						// 6. Presupuesto
						new Paragraph({
							text: '6. PRESUPUESTO',
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 400, after: 200 }
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Monto total: ', bold: true }),
								new TextRun(`$${project.monto_presupuesto_total.toFixed(2)}`)
							]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Fuentes de financiamiento: ', bold: true }),
								new TextRun(project.fuentes_financiamiento.map((f) => f.nombre).join(', '))
							]
						}),

						new Paragraph({
							children: [
								new TextRun({ text: 'Requiere aval: ', bold: true }),
								new TextRun(project.requiere_aval ? 'Sí' : 'No')
							]
						}),

						// 7. Instituciones
						new Paragraph({
							text: '7. INSTITUCIONES PARTICIPANTES',
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 400, after: 200 }
						}),

						...project.instituciones.map(
							(inst, index) =>
								new Paragraph({
									text: `${index + 1}. ${inst.nombre}${inst.sigla ? ` (${inst.sigla})` : ''}`
								})
						),

						// 8. Participantes
						...(project.participantes && project.participantes.length > 0
							? [
									new Paragraph({
										text: '8. EQUIPO DE INVESTIGACIÓN',
										heading: HeadingLevel.HEADING_1,
										spacing: { before: 400, after: 200 }
									}),
									...project.participantes.flatMap((part, index) => [
										new Paragraph({
											children: [new TextRun({ text: `${index + 1}. ${part.nombre}`, bold: true })],
											spacing: { before: index > 0 ? 200 : 0 }
										}),
										new Paragraph({
											text: `   Email: ${part.email}`
										}),
										new Paragraph({
											text: `   Cargo: ${part.cargo}`
										}),
										new Paragraph({
											text: `   Régimen: ${part.regimen_dedicacion}`
										})
									])
							  ]
							: []),

						// Pie de página
						new Paragraph({
							text: `\nInforme generado el ${new Date().toLocaleString('es-ES')}`,
							alignment: AlignmentType.CENTER,
							spacing: { before: 400 }
						})
					]
				}
			]
		});

		// Generar buffer
		return await Packer.toBuffer(doc);
	},

	/**
	 * Generar informe consolidado de múltiples proyectos (PDF)
	 */
	async generateConsolidatedPDF(projectIds?: number[]): Promise<Buffer> {
		// Obtener proyectos
		let projects: (ProyectoResponseDTO | null)[];

		if (projectIds && projectIds.length > 0) {
			projects = await Promise.all(projectIds.map((id) => AdminProjectsService.getProjectById(id)));
		} else {
			const result = await AdminProjectsService.listProjects(1, 10000);
			projects = result.data;
		}

		// Filtrar nulls
		const validProjects = projects.filter((p) => p !== null) as ProyectoResponseDTO[];

		if (validProjects.length === 0) {
			throw new Error('No hay proyectos para generar el informe');
		}

		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margins: {
						top: 50,
						bottom: 50,
						left: 50,
						right: 50
					}
				});

				const chunks: Buffer[] = [];

				doc.on('data', (chunk) => chunks.push(chunk));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', reject);

				// Encabezado
				doc.fontSize(20).font('Helvetica-Bold').text('INFORME CONSOLIDADO DE PROYECTOS', {
					align: 'center'
				});
				doc.moveDown();

				doc.fontSize(12).font('Helvetica').text(`Total de proyectos: ${validProjects.length}`, {
					align: 'center'
				});
				doc.moveDown(2);

				// Listar proyectos
				validProjects.forEach((project, index) => {
					// Título del proyecto
					doc
						.fontSize(14)
						.font('Helvetica-Bold')
						.text(`${index + 1}. ${project.titulo}`, {
							underline: true
						});
					doc.moveDown(0.5);

					// Información básica
					doc.fontSize(10).font('Helvetica').text(`Código: ${project.codigo}`);
					doc.text(`Estado: ${project.estado.nombre}`);
					doc.text(`Avance: ${project.porcentaje_avance}%`);
					doc.text(`Presupuesto: $${project.monto_presupuesto_total.toFixed(2)}`);
					doc.text(`Duración: ${project.cantidad_meses} meses`);

					// Fechas
					doc.text(
						`Inicio: ${new Date(project.fecha_inicio_planeada).toLocaleDateString(
							'es-ES'
						)} - Fin: ${new Date(project.fecha_fin_planeada).toLocaleDateString('es-ES')}`
					);

					// Instituciones
					if (project.instituciones.length > 0) {
						doc.text(`Instituciones: ${project.instituciones.map((i) => i.nombre).join(', ')}`);
					}

					// Participantes
					if (project.participantes && project.participantes.length > 0) {
						doc.text(`Participantes: ${project.participantes.length}`);
					}

					doc.moveDown(1.5);

					// Nueva página cada 5 proyectos (excepto el último)
					if ((index + 1) % 5 === 0 && index < validProjects.length - 1) {
						doc.addPage();
					}
				});

				// Pie de página
				doc
					.fontSize(10)
					.font('Helvetica')
					.text(`\nInforme generado el ${new Date().toLocaleString('es-ES')}`, {
						align: 'center'
					});

				doc.end();
			} catch (error) {
				reject(error);
			}
		});
	}
};
