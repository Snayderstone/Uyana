// src/lib/utils/normalizacion.ts

/**
 * Normaliza los nombres de facultad para que sean consistentes
 * entre los datos de proyectos y el GeoJSON.
 */
export function normalizarNombreFacultad(nombre: string): string {
  if (!nombre) return "No especificada";

  // Limpieza básica
  const nombreLimpio = nombre
    .trim()
    .replace(/\s+/g, " ") // elimina espacios múltiples
    .replace(/^facultad\s+de\s+/i, "") // elimina "Facultad de"
    .replace(/^facultad\s+/i, ""); // elimina "Facultad"

  // Mapeos explícitos para casos raros
  const mapeoNombres: Record<string, string> = {
    "Ciencias Agrícolas": "Facultad De Ciencias Agrícolas",
    "Facultad Ciencias Agrícolas": "Facultad De Ciencias Agrícolas",
    "Facultad de Ciencias Agrícolas": "Facultad De Ciencias Agrícolas",
    // 👇 añade más casos especiales si encuentras diferencias
    [nombreLimpio]:
      `Facultad De ${nombreLimpio.charAt(0).toUpperCase()}${nombreLimpio.slice(1)}`
  };

  if (mapeoNombres[nombre]) {
    return mapeoNombres[nombre];
  }

  if (nombre.startsWith("Facultad De ")) {
    return nombre;
  }

  if (!nombre.toLowerCase().includes("facultad")) {
    return `Facultad De ${nombreLimpio.charAt(0).toUpperCase()}${nombreLimpio.slice(1)}`;
  }

  return nombre;
}
