/**
 * Script de testing para Date Parser
 * Prueba el parseo de fechas naturales en español
 *
 * Uso: npx ts-node src/shared/utils/test-date-parser.ts
 */

import { parseNaturalDate, parseDateTime, extractAllDates, hasDate } from './date-parser.util';

console.log('='.repeat(60));
console.log('TESTING DATE PARSER (chrono-node)');
console.log('='.repeat(60));
console.log(`Fecha de referencia: ${new Date().toLocaleString('es-ES')}\n`);

const testCases = [
  'mañana a las 3pm',
  'el próximo lunes',
  '15 de diciembre',
  'en 2 horas',
  'la próxima semana',
  'hoy a las 5 de la tarde',
  'pasado mañana',
  'el viernes',
  'a las 9 de la mañana',
  'dentro de 3 días',
  'el 25 de noviembre a las 2:30pm',
  'mañana por la mañana'
];

console.log('1. Testing parseNaturalDate():\n');

testCases.forEach((text, index) => {
  const result = parseNaturalDate(text);
  const status = result ? '✅' : '❌';
  const dateStr = result
    ? result.toLocaleString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'No se pudo parsear';

  console.log(`   ${status} "${text}"`);
  console.log(`      → ${dateStr}\n`);
});

console.log('2. Testing parseDateTime() - Detectar si tiene hora:\n');

const timeCases = [
  'mañana a las 3pm',
  'el próximo lunes',
  'mañana'
];

timeCases.forEach(text => {
  const result = parseDateTime(text);
  const timeStatus = result.hasTime ? '🕐 Con hora' : '📅 Sin hora';

  console.log(`   "${text}"`);
  console.log(`      ${timeStatus}`);
  console.log(`      → ${result.date?.toLocaleString('es-ES') || 'null'}\n`);
});

console.log('3. Testing extractAllDates() - Múltiples fechas:\n');

const multiText = 'Tengo reunión mañana a las 3pm y otra el viernes a las 10am';
const dates = extractAllDates(multiText);

console.log(`   Texto: "${multiText}"`);
console.log(`   Fechas encontradas: ${dates.length}`);
dates.forEach((date, i) => {
  console.log(`      ${i + 1}. ${date.toLocaleString('es-ES')}`);
});

console.log('\n4. Testing hasDate() - Detectar si contiene fecha:\n');

const checkCases = [
  'Hola, ¿cómo estás?',
  'Agenda una cita mañana',
  'Recuérdame comprar pan'
];

checkCases.forEach(text => {
  const contains = hasDate(text);
  const status = contains ? '✅ Contiene fecha' : '❌ No contiene fecha';
  console.log(`   ${status}: "${text}"`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ TESTING COMPLETADO');
console.log('='.repeat(60));
