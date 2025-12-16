/**
 * Servicio para gestión geoespacial de Instituciones, Facultades y Carreras
 */

import { institucionesRepository } from '$lib/db/admin/geoespacial-instituciones.repository';
import { facultadesRepository } from '$lib/db/admin/geoespacial-facultades.repository';
import { carrerasRepository } from '$lib/db/admin/geoespacial-carreras.repository';
import { validateGeoJSON } from '$lib/models/admin/geoespacial.dto';
import type {
	Institucion,
	Facultad,
	Carrera,
	InstitucionConFacultades,
	FacultadConCarreras,
	CarreraConRelaciones,
	CreateInstitucionDTO,
	CreateFacultadDTO,
	CreateCarreraDTO,
	UpdateInstitucionDTO,
	UpdateFacultadDTO,
	UpdateCarreraDTO
} from '$lib/models/admin';

export class GeoespacialService {
	// ==================== INSTITUCIONES ====================

	async getAllInstituciones(
		includeRelations = false
	): Promise<Institucion[] | InstitucionConFacultades[]> {
		if (includeRelations) {
			return await institucionesRepository.getAllWithFacultades();
		}
		return await institucionesRepository.getAll();
	}

	async getInstitucionById(
		id: number,
		includeRelations = false
	): Promise<Institucion | InstitucionConFacultades | null> {
		if (includeRelations) {
			return await institucionesRepository.getByIdWithFacultades(id);
		}
		return await institucionesRepository.getById(id);
	}

	async createInstitucion(dto: CreateInstitucionDTO): Promise<Institucion> {
		// Validar nombre
		if (!dto.nombre || dto.nombre.trim() === '') {
			throw new Error('El nombre de la institución es obligatorio');
		}

		// Validar geometría si existe
		if (dto.geometry) {
			dto.geometry = validateGeoJSON(dto.geometry);
		}

		return await institucionesRepository.create(dto);
	}

	async updateInstitucion(id: number, dto: UpdateInstitucionDTO): Promise<Institucion> {
		// Verificar que existe
		const existing = await institucionesRepository.getById(id);
		if (!existing) {
			throw new Error('Institución no encontrada');
		}

		// Validar nombre si se proporciona
		if (dto.nombre !== undefined && dto.nombre.trim() === '') {
			throw new Error('El nombre de la institución no puede estar vacío');
		}

		// Validar geometría si se proporciona
		if (dto.geometry !== undefined && dto.geometry !== null) {
			dto.geometry = validateGeoJSON(dto.geometry);
		}

		return await institucionesRepository.update(id, dto);
	}

	async deleteInstitucion(id: number): Promise<void> {
		// Verificar que no tenga facultades asociadas
		const facultades = await facultadesRepository.getByInstitucion(id);
		if (facultades.length > 0) {
			throw new Error('No se puede eliminar la institución porque tiene facultades asociadas');
		}

		await institucionesRepository.delete(id);
	}

	// ==================== FACULTADES ====================

	async getAllFacultades(includeRelations = false): Promise<Facultad[] | FacultadConCarreras[]> {
		if (includeRelations) {
			return await facultadesRepository.getAllWithRelations();
		}
		return await facultadesRepository.getAll();
	}

	async getFacultadesByInstitucion(institucionId: number): Promise<Facultad[]> {
		return await facultadesRepository.getByInstitucion(institucionId);
	}

	async getFacultadById(
		id: number,
		includeRelations = false
	): Promise<Facultad | FacultadConCarreras | null> {
		if (includeRelations) {
			return await facultadesRepository.getByIdWithCarreras(id);
		}
		return await facultadesRepository.getById(id);
	}

	async createFacultad(dto: CreateFacultadDTO): Promise<Facultad> {
		// Validar campos obligatorios
		if (!dto.nombre || dto.nombre.trim() === '') {
			throw new Error('El nombre de la facultad es obligatorio');
		}
		if (!dto.institucion_id) {
			throw new Error('La institución es obligatoria');
		}

		// Verificar que la institución existe
		const institucion = await institucionesRepository.getById(dto.institucion_id);
		if (!institucion) {
			throw new Error('La institución especificada no existe');
		}

		// Validar geometría si existe
		if (dto.geometry) {
			dto.geometry = validateGeoJSON(dto.geometry);
		}

		return await facultadesRepository.create(dto);
	}

	async updateFacultad(id: number, dto: UpdateFacultadDTO): Promise<Facultad> {
		// Verificar que existe
		const existing = await facultadesRepository.getById(id);
		if (!existing) {
			throw new Error('Facultad no encontrada');
		}

		// Validar nombre si se proporciona
		if (dto.nombre !== undefined && dto.nombre.trim() === '') {
			throw new Error('El nombre de la facultad no puede estar vacío');
		}

		// Validar institución si se proporciona
		if (dto.institucion_id !== undefined) {
			const institucion = await institucionesRepository.getById(dto.institucion_id);
			if (!institucion) {
				throw new Error('La institución especificada no existe');
			}
		}

		// Validar geometría si se proporciona
		if (dto.geometry !== undefined && dto.geometry !== null) {
			dto.geometry = validateGeoJSON(dto.geometry);
		}

		return await facultadesRepository.update(id, dto);
	}

	async deleteFacultad(id: number): Promise<void> {
		// Verificar que no tenga carreras asociadas
		const carreras = await carrerasRepository.getByFacultad(id);
		if (carreras.length > 0) {
			throw new Error('No se puede eliminar la facultad porque tiene carreras asociadas');
		}

		await facultadesRepository.delete(id);
	}

	// ==================== CARRERAS ====================

	async getAllCarreras(includeRelations = false): Promise<Carrera[] | CarreraConRelaciones[]> {
		if (includeRelations) {
			return await carrerasRepository.getAllWithRelations();
		}
		return await carrerasRepository.getAll();
	}

	async getCarrerasByFacultad(facultadId: number): Promise<Carrera[]> {
		return await carrerasRepository.getByFacultad(facultadId);
	}

	async getCarreraById(
		id: number,
		includeRelations = false
	): Promise<Carrera | CarreraConRelaciones | null> {
		if (includeRelations) {
			return await carrerasRepository.getByIdWithRelations(id);
		}
		return await carrerasRepository.getById(id);
	}

	async createCarrera(dto: CreateCarreraDTO): Promise<Carrera> {
		// Validar campos obligatorios
		if (!dto.nombre || dto.nombre.trim() === '') {
			throw new Error('El nombre de la carrera es obligatorio');
		}
		if (!dto.facultad_id) {
			throw new Error('La facultad es obligatoria');
		}

		// Verificar que la facultad existe
		const facultad = await facultadesRepository.getById(dto.facultad_id);
		if (!facultad) {
			throw new Error('La facultad especificada no existe');
		}

		// Validar geometría si existe
		if (dto.geometry) {
			dto.geometry = validateGeoJSON(dto.geometry);
		}

		return await carrerasRepository.create(dto);
	}

	async updateCarrera(id: number, dto: UpdateCarreraDTO): Promise<Carrera> {
		// Verificar que existe
		const existing = await carrerasRepository.getById(id);
		if (!existing) {
			throw new Error('Carrera no encontrada');
		}

		// Validar nombre si se proporciona
		if (dto.nombre !== undefined && dto.nombre.trim() === '') {
			throw new Error('El nombre de la carrera no puede estar vacío');
		}

		// Validar facultad si se proporciona
		if (dto.facultad_id !== undefined) {
			const facultad = await facultadesRepository.getById(dto.facultad_id);
			if (!facultad) {
				throw new Error('La facultad especificada no existe');
			}
		}

		// Validar geometría si se proporciona
		if (dto.geometry !== undefined && dto.geometry !== null) {
			dto.geometry = validateGeoJSON(dto.geometry);
		}

		return await carrerasRepository.update(id, dto);
	}

	async deleteCarrera(id: number): Promise<void> {
		await carrerasRepository.delete(id);
	}

	// ==================== ESTADÍSTICAS ====================

	async getEstadisticas() {
		const [instituciones, facultades, carreras] = await Promise.all([
			institucionesRepository.count(),
			facultadesRepository.count(),
			carrerasRepository.count()
		]);

		return {
			instituciones,
			facultades,
			carreras
		};
	}
}

export const geoespacialService = new GeoespacialService();
