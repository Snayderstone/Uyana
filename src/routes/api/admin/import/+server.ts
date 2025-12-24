/**
 * Admin API - Import Projects Endpoint
 * -------------------------------------
 * POST   /api/admin/import            - Importar proyectos desde CSV/Excel
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminImportExportService } from '$lib/services/admin/import-export.service';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ImportProyectoRowDTO } from '$lib/models/admin';

/**
 * POST - Importar proyectos desde archivo Excel o CSV
 *
 * Acepta:
 * 1. FormData con archivo (multipart/form-data)
 * 2. JSON con array de datos
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const contentType = request.headers.get('content-type') || '';
		let rows: ImportProyectoRowDTO[] = [];

		// Opción 1: FormData con archivo
		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return json(
					{
						success: false,
						message: 'No se proporcionó ningún archivo'
					},
					{ status: 400 }
				);
			}

			// Validar tipo de archivo
			const fileName = file.name.toLowerCase();
			const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
			const isCSV = fileName.endsWith('.csv');

			if (!isExcel && !isCSV) {
				return json(
					{
						success: false,
						message: 'El archivo debe ser de tipo Excel (.xlsx, .xls) o CSV (.csv)'
					},
					{ status: 400 }
				);
			}

			// Leer archivo
			const arrayBuffer = await file.arrayBuffer();

			if (isExcel) {
				// Procesar Excel
				const workbook = XLSX.read(arrayBuffer, { type: 'array' });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];

				// Convertir a JSON
				const jsonData = XLSX.utils.sheet_to_json(worksheet, {
					raw: false, // Obtener valores formateados
					defval: '' // Valor por defecto para celdas vacías
				});

				rows = jsonData as ImportProyectoRowDTO[];
			} else {
				// Procesar CSV
				const text = new TextDecoder().decode(arrayBuffer);
				const parseResult = Papa.parse<ImportProyectoRowDTO>(text, {
					header: true,
					skipEmptyLines: true,
					transformHeader: (header) => header.trim()
				});

				if (parseResult.errors.length > 0) {
					return json(
						{
							success: false,
							message: 'Error al parsear el archivo CSV',
							errors: parseResult.errors
						},
						{ status: 400 }
					);
				}

				rows = parseResult.data;
			}
		}
		// Opción 2: JSON directo
		else if (contentType.includes('application/json')) {
			const body = await request.json();
			const { data } = body as { data: ImportProyectoRowDTO[] };

			if (!data || !Array.isArray(data)) {
				return json(
					{
						success: false,
						message: 'Se esperaba un array de datos en el campo "data"'
					},
					{ status: 400 }
				);
			}

			rows = data;
		}
		// Content-Type no soportado
		else {
			return json(
				{
					success: false,
					message: 'Content-Type no soportado. Use multipart/form-data o application/json'
				},
				{ status: 415 }
			);
		}

		// Validar que haya datos
		if (rows.length === 0) {
			return json(
				{
					success: false,
					message: 'No se proporcionaron datos para importar'
				},
				{ status: 400 }
			);
		}

		// Procesar importación
		const result = await AdminImportExportService.importProjects(rows);

		const statusCode = result.success ? 200 : result.imported_count > 0 ? 207 : 400;

		return json(
			{
				success: result.success,
				data: {
					imported_count: result.imported_count,
					failed_count: result.failed_count,
					total_rows: rows.length,
					errors: result.errors,
					warnings: result.warnings
				},
				message: result.success
					? `Se importaron ${result.imported_count} proyectos exitosamente`
					: `Se importaron ${result.imported_count} proyectos, ${result.failed_count} fallaron`
			},
			{ status: statusCode }
		);
	} catch (error) {
		console.error('Error al importar proyectos:', error);
		return json(
			{
				success: false,
				message: 'Error al procesar la importación'
			},
			{ status: 500 }
		);
	}
};
