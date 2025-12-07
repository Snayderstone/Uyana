/**
 * Filters Model
 * -------------
 * Representa los filtros usados para consultar proyectos en los servicios.
 */

export type ProjectFilters = {
    institutionId?: number;
    facultyId?: number;
    areaId?: number;
    lineId?: number;
    typeId?: number;
    stateId?: number;
};
