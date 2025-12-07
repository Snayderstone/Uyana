/**
 * Map Service
 * -----------
 * Se encarga de preparar datos para mostrar en:
 *  - mapas de calor
 *  - polígonos por institución/facultad
 *  - grafos/redes de relaciones
 */

export const MapService = {

    // TODO: generar heatmap desde proyectos
    async generateHeatmap(projects: any[]) { /* implementar */ },

    // TODO: generar shapes por institución
    async getInstitutionRegions() { /* implementar */ },

    // TODO: generar shapes por facultad
    async getFacultyRegions() { /* implementar */ },

    // TODO: construir grafo/red
    async generateNetworkGraph(projects: any[]) { /* implementar */ },

};
