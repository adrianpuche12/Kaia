// Setup global para tests
import { beforeAll, afterAll, afterEach } from '@jest/globals';

// Mock de Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    voiceCommand: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Setup global antes de todos los tests
beforeAll(() => {
  // Configurar variables de entorno de test
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '15m';
});

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup después de todos los tests
afterAll(() => {
  // Cleanup si es necesario
});
