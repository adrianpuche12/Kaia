import * as chrono from 'chrono-node';

/**
 * Date Parser Utility
 * Parsea fechas en lenguaje natural a objetos Date
 * Usando chrono-node para español
 */

/**
 * Configurar chrono para español
 */
const es = chrono.es;

/**
 * Parsear fecha natural a Date
 * @param text Texto con fecha natural (ej: "mañana a las 3pm")
 * @param referenceDate Fecha de referencia (default: ahora)
 * @returns Date o null si no se pudo parsear
 */
export function parseNaturalDate(text: string, referenceDate?: Date): Date | null {
  const results = es.parse(text, referenceDate || new Date());

  if (results.length === 0) {
    return null;
  }

  // Retornar la primera fecha encontrada
  return results[0].start.date();
}

/**
 * Parsear fecha y hora natural
 * @param text Texto con fecha/hora natural
 * @param referenceDate Fecha de referencia
 * @returns Objeto con fecha y hora separadas
 */
export function parseDateTime(text: string, referenceDate?: Date): {
  date: Date | null;
  hasTime: boolean;
} {
  const results = es.parse(text, referenceDate || new Date());

  if (results.length === 0) {
    return { date: null, hasTime: false };
  }

  const result = results[0];
  const date = result.start.date();

  // Verificar si tiene hora específica
  const hasTime = result.start.isCertain('hour');

  return { date, hasTime };
}

/**
 * Extraer múltiples fechas de un texto
 * @param text Texto con múltiples fechas
 * @returns Array de fechas encontradas
 */
export function extractAllDates(text: string): Date[] {
  const results = es.parse(text);
  return results.map(r => r.start.date());
}

/**
 * Verificar si un texto contiene una fecha
 * @param text Texto a analizar
 * @returns true si contiene fecha
 */
export function hasDate(text: string): boolean {
  const results = es.parse(text);
  return results.length > 0;
}

/**
 * Ejemplos de uso:
 *
 * parseNaturalDate("mañana a las 3pm")
 * parseNaturalDate("el próximo lunes")
 * parseNaturalDate("15 de diciembre")
 * parseNaturalDate("en 2 horas")
 * parseNaturalDate("la próxima semana")
 */
