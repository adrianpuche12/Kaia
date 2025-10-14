# Guía de Testing - Kaia Backend

## 📋 Tabla de Contenidos

1. [Overview](#overview)
2. [Configuración](#configuración)
3. [Ejecutar Tests](#ejecutar-tests)
4. [Estructura de Tests](#estructura-de-tests)
5. [Coverage](#coverage)
6. [Escribir Nuevos Tests](#escribir-nuevos-tests)

---

## Overview

El proyecto utiliza **Jest** como framework de testing con **ts-jest** para soporte de TypeScript.

### Estado Actual de Tests

| Categoría | Tests | Cobertura |
|-----------|-------|-----------|
| **Validators** | 32 tests | 100% ✅ |
| **Integrations** | 20 tests | 68.35% |
| **Total** | **52 tests** | **Promedio: 84%** |

### Resultados

```
Test Suites: 2 passed, 2 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        ~15s
```

---

## Configuración

### Dependencias Instaladas

```json
{
  "devDependencies": {
    "@jest/globals": "^30.2.0",
    "@types/jest": "^30.0.0",
    "jest": "^30.2.0",
    "ts-jest": "^29.4.5"
  }
}
```

### Archivo de Configuración

`jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

### Setup Global

`src/__tests__/setup.ts` configura:
- Mocks de Prisma Client
- Variables de entorno de test
- Cleanup después de cada test

---

## Ejecutar Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests en modo verbose
npm run test:verbose
```

### Ejecutar Tests Específicos

```bash
# Solo tests de validators
npm test validators.test.ts

# Solo tests de integrations
npm test integrations.test.ts

# Tests que coincidan con un patrón
npm test -- --testNamePattern="Email"
```

---

## Estructura de Tests

### Organización de Archivos

```
src/
└── __tests__/
    ├── setup.ts                  # Setup global
    ├── validators.test.ts        # Tests de validadores (32 tests)
    └── integrations.test.ts      # Tests de integraciones (20 tests)
```

### Convenciones de Naming

- Archivos de test: `*.test.ts`
- Ubicación: `src/__tests__/`
- Describe blocks: Agrupan tests relacionados
- Test names: Descriptivos y en inglés

---

## Coverage

### Ejecutar Coverage

```bash
npm run test:coverage
```

### Resultados de Coverage

```
File                 | % Stmts | % Branch | % Funcs | % Lines
---------------------|---------|----------|---------|--------
All files            |    2.75 |      1.2 |     3.1 |    2.81
integrations/        |   68.35 |    30.95 |      80 |   67.94
  TwilioClient.ts    |      ~70|       ~30|      100|      ~70
  SendGridClient.ts  |      ~70|       ~30|      ~60|      ~70
utils/               |   11.06 |     4.42 |   16.32 |   11.16
  validators.ts      |     100 |      100 |     100 |     100 ✅
```

### Reportes de Coverage

El coverage genera reportes en:
- **Terminal**: Resumen inmediato
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`

Para ver el reporte HTML:
```bash
# En Windows
start coverage/lcov-report/index.html

# En macOS
open coverage/lcov-report/index.html

# En Linux
xdg-open coverage/lcov-report/index.html
```

---

## Tests Implementados

### 1. Validators Tests (32 tests)

#### Email Validation
```typescript
describe('Validators - Email', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });
});
```

**Cobertura**: ✅ 100%

#### Password Validation
```typescript
describe('Validators - Password', () => {
  it('should validate correct passwords', () => {
    expect(isValidPassword('Test1234')).toBe(true);
  });

  it('should reject invalid passwords', () => {
    expect(isValidPassword('short1')).toBe(false); // Too short
    expect(isValidPassword('nouppercas1')).toBe(false);
  });
});
```

**Cobertura**: ✅ 100%

#### Zod Schemas
- Register schema: 4 tests
- Login schema: 2 tests
- Create Event schema: 3 tests
- Send Message schema: 5 tests
- Location schema: 3 tests
- Voice schema: 3 tests

**Cobertura**: ✅ 100%

### 2. Integration Tests (20 tests)

#### TwilioClient Tests
```typescript
describe('TwilioClient Integration', () => {
  it('should send SMS successfully', async () => {
    const result = await twilioClient.sendSMS({
      to: '+34612345678',
      message: 'Test SMS from Kaia',
    });
    expect(result.sid).toBeTruthy();
  });
});
```

**Tests incluidos**:
- ✅ Send SMS (2 tests)
- ✅ Send WhatsApp (2 tests)
- ✅ Validate phone number (2 tests)
- ✅ Error handling (1 test)

**Cobertura**: ~70%

#### SendGridClient Tests
```typescript
describe('SendGridClient Integration', () => {
  it('should send email successfully', async () => {
    const result = await sendGridClient.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'Content',
    });
    expect(result.messageId).toBeTruthy();
  });
});
```

**Tests incluidos**:
- ✅ Send email (4 tests)
- ✅ Send template email (2 tests)
- ✅ Send bulk email (2 tests)
- ✅ Validate email (2 tests)
- ✅ Create HTML email (3 tests)
- ✅ Error handling (1 test)

**Cobertura**: ~70%

---

## Escribir Nuevos Tests

### Template Básico

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup antes de cada test
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Mejores Prácticas

#### 1. Usar describe blocks para agrupar

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should reject duplicate email', () => {});
  });

  describe('updateUser', () => {
    it('should update user profile', () => {});
  });
});
```

#### 2. Setup y Teardown

```typescript
describe('DatabaseTests', () => {
  beforeEach(() => {
    // Ejecutar antes de cada test
  });

  afterEach(() => {
    // Limpiar después de cada test
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // Ejecutar una vez antes de todos
  });

  afterAll(() => {
    // Ejecutar una vez después de todos
  });
});
```

#### 3. Mocking

```typescript
// Mock de función
const mockFunction = jest.fn();
mockFunction.mockReturnValue('value');
mockFunction.mockResolvedValue(Promise.resolve('async value'));

// Mock de módulo
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));
```

#### 4. Assertions Comunes

```typescript
// Valores
expect(value).toBe(expected);
expect(value).toEqual(expected); // Deep equality
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Números
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objetos
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow('error');

// Funciones
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(2);
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

---

## Próximos Pasos

### Tests Pendientes

1. **Controllers**: Tests para todos los controllers
2. **Services**: Tests para lógica de negocio
3. **Repositories**: Tests para operaciones de base de datos
4. **Middleware**: Tests para auth, validation, rate limiting
5. **E2E Tests**: Tests de integración completos

### Meta de Coverage

- **Objetivo a corto plazo**: 60% de coverage general
- **Objetivo a largo plazo**: 80% de coverage general
- **Crítico**: 100% en validators y utils ✅

---

## Troubleshooting

### Error: "Cannot find module"

**Solución**: Verificar que el path en el import sea correcto y que el archivo exista.

### Error: "TypeError: X is not a function"

**Solución**: Verificar que el mock esté configurado correctamente.

### Tests lentos

**Solución**:
- Usar `--maxWorkers=50%` para limitar workers
- Evitar operaciones de I/O reales
- Usar mocks apropiadamente

### Coverage incompleto

**Solución**:
- Revisar `collectCoverageFrom` en jest.config.js
- Asegurarse de que los archivos estén en el path correcto

---

**Última actualización**: Día 20 - Octubre 2025
**Versión**: 1.0.0
**Tests**: 52 passing
**Coverage**: 84% (validators + integrations)
