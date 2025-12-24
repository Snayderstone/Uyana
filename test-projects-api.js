/**
 * Script de prueba para API de Proyectos
 * Ejecutar con: node test-projects-api.js
 */

const BASE_URL = 'http://localhost:5173';

// Colores para consola
const colors = {
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m'
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
	const url = `${BASE_URL}${endpoint}`;
	log(`\n🧪 Probando: ${method} ${endpoint}`, 'blue');

	try {
		const options = {
			method,
			headers: {
				'Content-Type': 'application/json'
			}
		};

		if (data) {
			options.body = JSON.stringify(data);
		}

		const response = await fetch(url, options);
		const result = await response.json();

		if (response.status === expectedStatus) {
			log(`✅ ÉXITO - Status: ${response.status}`, 'green');
			console.log('Respuesta:', JSON.stringify(result, null, 2));
			return { success: true, data: result };
		} else {
			log(`⚠️ Status inesperado: ${response.status} (esperado: ${expectedStatus})`, 'yellow');
			console.log('Respuesta:', JSON.stringify(result, null, 2));
			return { success: false, data: result };
		}
	} catch (error) {
		log(`❌ ERROR: ${error.message}`, 'red');
		return { success: false, error: error.message };
	}
}

async function runTests() {
	log('\n' + '='.repeat(60), 'blue');
	log('🚀 INICIANDO PRUEBAS DE API DE PROYECTOS', 'blue');
	log('='.repeat(60) + '\n', 'blue');

	let projectId = null;

	// ==========================================
	// PRUEBA 1: Listar catálogos
	// ==========================================
	log('\n📚 FASE 1: VERIFICAR CATÁLOGOS', 'yellow');

	await testEndpoint('GET', '/api/admin/catalogs/estados');
	await testEndpoint('GET', '/api/admin/catalogs/tipos');
	await testEndpoint('GET', '/api/admin/catalogs/areas');
	await testEndpoint('GET', '/api/admin/catalogs/lineas');
	await testEndpoint('GET', '/api/admin/catalogs/fuentes');
	await testEndpoint('GET', '/api/admin/catalogs/instituciones');
	await testEndpoint('GET', '/api/admin/catalogs/cargos');
	await testEndpoint('GET', '/api/admin/catalogs/regimenes');

	// ==========================================
	// PRUEBA 2: Crear proyecto
	// ==========================================
	log('\n📝 FASE 2: CREAR PROYECTO DE PRUEBA', 'yellow');

	const nuevoProyecto = {
		codigo: 'TEST-2025-' + Date.now(),
		titulo: 'Proyecto de Prueba Automatizada',
		objetivo: 'Validar el funcionamiento del API de proyectos',
		estado_id: 1,
		fecha_inicio_planeada: '2025-01-01',
		fecha_fin_planeada: '2025-12-31',
		cantidad_meses: 12,
		porcentaje_avance: 0,
		monto_presupuesto_total: 50000,
		impacto_cientifico: 'Validación de sistema',
		impacto_economico: 'Optimización de procesos',
		impacto_social: 'Mejora de servicios académicos',
		otros_impactos: 'N/A',
		requiere_aval: false,
		para_siies: false,
		instituciones_ids: [1],
		tipos_ids: [1],
		areas_conocimiento_ids: [1],
		lineas_investigacion_ids: [1],
		fuentes_financiamiento_ids: [1],
		participantes: []
	};

	const createResult = await testEndpoint('POST', '/api/admin/projects', nuevoProyecto, 201);

	if (createResult.success && createResult.data.data) {
		projectId = createResult.data.data.id;
		log(`\n✅ Proyecto creado con ID: ${projectId}`, 'green');
	}

	// ==========================================
	// PRUEBA 3: Listar proyectos
	// ==========================================
	log('\n📋 FASE 3: LISTAR PROYECTOS', 'yellow');

	await testEndpoint('GET', '/api/admin/projects');
	await testEndpoint('GET', '/api/admin/projects?page=1&limit=5');

	// ==========================================
	// PRUEBA 4: Obtener proyecto específico
	// ==========================================
	if (projectId) {
		log('\n🔍 FASE 4: OBTENER PROYECTO ESPECÍFICO', 'yellow');
		await testEndpoint('GET', `/api/admin/projects/${projectId}`);
	}

	// ==========================================
	// PRUEBA 5: Actualizar proyecto
	// ==========================================
	if (projectId) {
		log('\n✏️ FASE 5: ACTUALIZAR PROYECTO', 'yellow');

		const updateData = {
			porcentaje_avance: 50,
			titulo: 'Proyecto de Prueba ACTUALIZADO'
		};

		await testEndpoint('PUT', `/api/admin/projects/${projectId}`, updateData);
	}

	// ==========================================
	// PRUEBA 6: Validaciones (debe fallar)
	// ==========================================
	log('\n⚠️ FASE 6: PROBAR VALIDACIONES', 'yellow');

	const proyectoInvalido = {
		codigo: '', // Vacío - debe fallar
		titulo: '',
		objetivo: ''
	};

	await testEndpoint('POST', '/api/admin/projects', proyectoInvalido, 400);

	// ==========================================
	// PRUEBA 7: Código duplicado (debe fallar)
	// ==========================================
	log('\n⚠️ FASE 7: PROBAR CÓDIGO DUPLICADO', 'yellow');

	if (projectId) {
		const proyectoDuplicado = {
			...nuevoProyecto,
			codigo: nuevoProyecto.codigo // Mismo código
		};

		await testEndpoint('POST', '/api/admin/projects', proyectoDuplicado, 409);
	}

	// ==========================================
	// PRUEBA 8: Eliminar proyecto
	// ==========================================
	if (projectId) {
		log('\n🗑️ FASE 8: ELIMINAR PROYECTO DE PRUEBA', 'yellow');
		await testEndpoint('DELETE', `/api/admin/projects/${projectId}`);

		// Verificar que ya no existe
		log('\n✅ Verificando eliminación...', 'yellow');
		await testEndpoint('GET', `/api/admin/projects/${projectId}`, null, 404);
	}

	// ==========================================
	// PRUEBA 9: Participantes
	// ==========================================
	log('\n👥 FASE 9: API DE PARTICIPANTES', 'yellow');

	await testEndpoint('GET', '/api/admin/participants');

	const nuevoParticipante = {
		nombre: 'Participante de Prueba',
		email: 'test-' + Date.now() + '@test.com',
		genero: 'M',
		carrera_id: 1,
		acreditado: true
	};

	const participantResult = await testEndpoint(
		'POST',
		'/api/admin/participants',
		nuevoParticipante,
		201
	);

	let participantId = null;
	if (participantResult.success && participantResult.data.data) {
		participantId = participantResult.data.data.id;
		log(`\n✅ Participante creado con ID: ${participantId}`, 'green');

		// Eliminar participante de prueba
		await testEndpoint('DELETE', `/api/admin/participants/${participantId}`);
	}

	// ==========================================
	// RESUMEN
	// ==========================================
	log('\n' + '='.repeat(60), 'blue');
	log('✅ PRUEBAS COMPLETADAS', 'green');
	log('='.repeat(60) + '\n', 'blue');

	log('📊 RESUMEN:', 'blue');
	log('- Se probaron los endpoints principales de la API', 'reset');
	log('- Se verificaron validaciones y restricciones', 'reset');
	log('- Se probó el ciclo completo CRUD', 'reset');
	log('\n👉 Revisa los logs arriba para ver detalles de cada prueba\n', 'yellow');
}

// Ejecutar pruebas
runTests().catch((error) => {
	log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
	console.error(error);
	process.exit(1);
});
