/**
 * Investigator Model
 * -------------------
 * Modelo para investigadores/participantes, usado por la UI.
 */

export type InvestigatorModel = {
    id: number;
    name: string;
    email: string;
    gender: string;
    accredited: boolean;

    career?: any;     // carrera asociada
    faculty?: any;    // facultad asociada
    socials?: any[];  // redes sociales procesadas
};
