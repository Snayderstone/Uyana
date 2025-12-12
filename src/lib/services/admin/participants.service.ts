/**
 * Admin Module - Participants Service
 * ------------------------------------
 * Servicio para gestión de participantes/investigadores.
 */

import { AdminParticipantsRepository } from '$lib/db/admin/participants.repository';
import { AdminCarrerasRepository } from '$lib/db/admin/catalogs.repository';
import type {
	CreateParticipanteDTO,
	UpdateParticipanteDTO,
	ParticipanteResponseDTO,
	ValidationErrorDTO
} from '$lib/models/admin/dtos';
import type { Participante } from '$lib/models/admin/entities';

export const AdminParticipantsService = {
	/**
	 * Validar campos de participante
	 */
	validateParticipant(dto: CreateParticipanteDTO | UpdateParticipanteDTO): ValidationErrorDTO[] {
		const errors: ValidationErrorDTO[] = [];

		if ('nombre' in dto && !dto.nombre?.trim()) {
			errors.push({ field: 'nombre', message: 'El nombre es obligatorio' });
		}

		if ('email' in dto) {
			if (!dto.email?.trim()) {
				errors.push({ field: 'email', message: 'El email es obligatorio' });
			} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
				errors.push({ field: 'email', message: 'El email no es válido' });
			}
		}

		if ('genero' in dto && !dto.genero?.trim()) {
			errors.push({ field: 'genero', message: 'El género es obligatorio' });
		}

		if ('carrera_id' in dto && !dto.carrera_id) {
			errors.push({ field: 'carrera_id', message: 'La carrera es obligatoria' });
		}

		return errors;
	},

	/**
	 * Verificar si el email ya existe
	 */
	async checkDuplicateEmail(email: string, excludeId?: number): Promise<boolean> {
		const existing = await AdminParticipantsRepository.getParticipantByEmail(email);
		if (!existing) return false;
		if (excludeId && existing.id === excludeId) return false;
		return true;
	},

	/**
	 * Crear un participante
	 */
	async createParticipant(dto: CreateParticipanteDTO): Promise<ParticipanteResponseDTO | null> {
		const errors = this.validateParticipant(dto);
		if (errors.length > 0) {
			console.error('Errores de validación:', errors);
			return null;
		}

		// Verificar email duplicado
		const isDuplicate = await this.checkDuplicateEmail(dto.email);
		if (isDuplicate) {
			console.error('El email ya está registrado');
			return null;
		}

		const participanteData: Omit<Participante, 'id'> = {
			carrera_id: dto.carrera_id,
			email: dto.email.trim().toLowerCase(),
			nombre: dto.nombre.trim(),
			genero: dto.genero.trim(),
			url_foto: dto.url_foto,
			acreditado: dto.acreditado || false,
			redes_sociales: dto.redes_sociales
		};

		const participante = await AdminParticipantsRepository.createParticipant(participanteData);
		if (!participante) return null;

		return await this.getParticipantById(participante.id);
	},

	/**
	 * Actualizar un participante
	 */
	async updateParticipant(dto: UpdateParticipanteDTO): Promise<ParticipanteResponseDTO | null> {
		const errors = this.validateParticipant(dto);
		if (errors.length > 0) {
			console.error('Errores de validación:', errors);
			return null;
		}

		// Verificar email duplicado si se está actualizando
		if (dto.email) {
			const isDuplicate = await this.checkDuplicateEmail(dto.email, dto.id);
			if (isDuplicate) {
				console.error('El email ya está registrado');
				return null;
			}
		}

		const updateData: Partial<Participante> = {};
		if (dto.nombre) updateData.nombre = dto.nombre.trim();
		if (dto.email) updateData.email = dto.email.trim().toLowerCase();
		if (dto.genero) updateData.genero = dto.genero.trim();
		if (dto.carrera_id) updateData.carrera_id = dto.carrera_id;
		if (dto.url_foto !== undefined) updateData.url_foto = dto.url_foto;
		if (dto.acreditado !== undefined) updateData.acreditado = dto.acreditado;
		if (dto.redes_sociales !== undefined) updateData.redes_sociales = dto.redes_sociales;

		const participante = await AdminParticipantsRepository.updateParticipant(dto.id, updateData);
		if (!participante) return null;

		return await this.getParticipantById(dto.id);
	},

	/**
	 * Eliminar un participante
	 */
	async deleteParticipant(id: number): Promise<boolean> {
		return await AdminParticipantsRepository.deleteParticipant(id);
	},

	/**
	 * Obtener un participante por ID con sus relaciones
	 */
	async getParticipantById(id: number): Promise<ParticipanteResponseDTO | null> {
		const data = await AdminParticipantsRepository.getParticipantWithCareer(id);
		if (!data) return null;

		return {
			id: data.id,
			nombre: data.nombre,
			email: data.email,
			genero: data.genero,
			url_foto: data.url_foto,
			acreditado: data.acreditado || false,
			redes_sociales: data.redes_sociales,
			carrera: {
				id: data.carrera.id,
				nombre: data.carrera.nombre,
				facultad: {
					id: data.carrera.facultad.id,
					nombre: data.carrera.facultad.nombre
				}
			}
		};
	},

	/**
	 * Listar participantes con filtros y paginación
	 */
	async listParticipants(
		page: number = 1,
		limit: number = 10,
		filters?: {
			nombre?: string;
			email?: string;
			genero?: string;
			acreditado?: boolean;
			carrera_id?: number;
		}
	) {
		const { data, total } = await AdminParticipantsRepository.listParticipants(
			page,
			limit,
			filters
		);

		const participantes = await Promise.all(
			data.map(async (p) => await this.getParticipantById(p.id))
		);

		return {
			data: participantes.filter((p) => p !== null) as ParticipanteResponseDTO[],
			pagination: {
				page,
				limit,
				total,
				total_pages: Math.ceil(total / limit)
			}
		};
	},

	/**
	 * Listar participantes acreditados
	 */
	async listAccreditedParticipants() {
		const data = await AdminParticipantsRepository.listAccreditedParticipants();
		return await Promise.all(data.map(async (p) => await this.getParticipantById(p.id)));
	}
};
