// Parser de fechas en lenguaje natural a formato ISO
import { addDays, addWeeks, addMonths, setHours, setMinutes, startOfDay, nextDay } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Parsea fechas relativas como "mañana", "próximo martes", "en 3 días"
 */
export function parseRelativeDate(dateString: string, referenceDate: Date = new Date()): Date | null {
  const normalized = dateString.toLowerCase().trim();

  // Hoy
  if (normalized === 'hoy' || normalized === 'today') {
    return startOfDay(referenceDate);
  }

  // Mañana
  if (normalized === 'mañana' || normalized === 'tomorrow') {
    return addDays(startOfDay(referenceDate), 1);
  }

  // Pasado mañana
  if (normalized === 'pasado mañana' || normalized === 'day after tomorrow') {
    return addDays(startOfDay(referenceDate), 2);
  }

  // Días de la semana
  const daysMap: Record<string, number> = {
    'domingo': 0, 'sunday': 0,
    'lunes': 1, 'monday': 1,
    'martes': 2, 'tuesday': 2,
    'miércoles': 3, 'miercoles': 3, 'wednesday': 3,
    'jueves': 4, 'thursday': 4,
    'viernes': 5, 'friday': 5,
    'sábado': 6, 'sabado': 6, 'saturday': 6,
  };

  // Próximo [día]
  for (const [dayName, dayIndex] of Object.entries(daysMap)) {
    if (normalized.includes(dayName)) {
      const isNext = normalized.includes('próximo') || normalized.includes('proximo') || normalized.includes('next');
      return nextDay(referenceDate, dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    }
  }

  // En X días/semanas/meses
  const inPattern = /en\s+(\d+)\s+(día|dias|día|semana|semanas|mes|meses)/i;
  const match = normalized.match(inPattern);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];

    if (unit.includes('día') || unit.includes('dia')) {
      return addDays(startOfDay(referenceDate), amount);
    }
    if (unit.includes('semana')) {
      return addWeeks(startOfDay(referenceDate), amount);
    }
    if (unit.includes('mes')) {
      return addMonths(startOfDay(referenceDate), amount);
    }
  }

  return null;
}

/**
 * Parsea horas en lenguaje natural
 * Ejemplos: "3 PM", "15:30", "3 de la tarde", "media tarde"
 */
export function parseTime(timeString: string): { hour: number; minute: number } | null {
  const normalized = timeString.toLowerCase().trim();

  // Formato 24h: "15:30", "09:00"
  const time24Pattern = /^(\d{1,2}):(\d{2})$/;
  const match24 = normalized.match(time24Pattern);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  // Formato AM/PM: "3 PM", "11 AM"
  const timeAMPMPattern = /(\d{1,2})\s*(am|pm)/i;
  const matchAMPM = normalized.match(timeAMPMPattern);
  if (matchAMPM) {
    let hour = parseInt(matchAMPM[1], 10);
    const isPM = matchAMPM[2].toLowerCase() === 'pm';

    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    return { hour, minute: 0 };
  }

  // Expresiones en español
  const spanishTimes: Record<string, { hour: number; minute: number }> = {
    'medianoche': { hour: 0, minute: 0 },
    'media noche': { hour: 0, minute: 0 },
    'madrugada': { hour: 3, minute: 0 },
    'mañana temprano': { hour: 7, minute: 0 },
    'media mañana': { hour: 10, minute: 0 },
    'mediodía': { hour: 12, minute: 0 },
    'medio día': { hour: 12, minute: 0 },
    'tarde': { hour: 15, minute: 0 },
    'media tarde': { hour: 16, minute: 0 },
    'atardecer': { hour: 18, minute: 0 },
    'noche': { hour: 20, minute: 0 },
  };

  for (const [phrase, time] of Object.entries(spanishTimes)) {
    if (normalized.includes(phrase)) {
      return time;
    }
  }

  // Número solo (asume hora exacta)
  const numberPattern = /^(\d{1,2})$/;
  const matchNumber = normalized.match(numberPattern);
  if (matchNumber) {
    const hour = parseInt(matchNumber[1], 10);
    if (hour >= 0 && hour <= 23) {
      return { hour, minute: 0 };
    }
  }

  return null;
}

/**
 * Combina fecha y hora en un Date
 */
export function combineDateAndTime(
  dateString: string,
  timeString: string,
  referenceDate: Date = new Date()
): Date | null {
  const date = parseRelativeDate(dateString, referenceDate);
  if (!date) return null;

  const time = parseTime(timeString);
  if (!time) return null;

  return setMinutes(setHours(date, time.hour), time.minute);
}

/**
 * Intenta parsear una fecha completa en lenguaje natural
 * Ejemplo: "mañana a las 3 de la tarde", "próximo martes 15:30"
 */
export function parseNaturalDateTime(input: string, referenceDate: Date = new Date()): Date | null {
  const normalized = input.toLowerCase().trim();

  // Buscar separadores "a las", "a la", "at"
  const separators = [' a las ', ' a la ', ' at '];
  for (const separator of separators) {
    if (normalized.includes(separator)) {
      const [datePart, timePart] = normalized.split(separator);
      return combineDateAndTime(datePart, timePart, referenceDate);
    }
  }

  // Intentar solo fecha
  const date = parseRelativeDate(normalized, referenceDate);
  if (date) return date;

  // Intentar solo hora (usar fecha de referencia)
  const time = parseTime(normalized);
  if (time) {
    return setMinutes(setHours(referenceDate, time.hour), time.minute);
  }

  return null;
}

/**
 * Formatea una fecha a string legible en español
 */
export function formatDateToSpanish(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('es-ES', options);
}

/**
 * Formatea una hora a string legible
 */
export function formatTimeToSpanish(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default {
  parseRelativeDate,
  parseTime,
  combineDateAndTime,
  parseNaturalDateTime,
  formatDateToSpanish,
  formatTimeToSpanish,
};
