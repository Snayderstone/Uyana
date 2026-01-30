/**
 * Investigator Model
 * -------------------
 * Modelo para investigadores/participantes, usado por la UI.
 */

// src/lib/models/investigator.model.ts

export type Investigador = {
  id: number;
  foto: string;
  nombre: string;
  email: string;
  linea_investigacion: string;
  carrera: string;
  facultad: string;
  redes: string;
  // Propiedades calculadas para la interfaz
  redesArray?: Array<{ nombre: string; url: string }>;
};

