/**
 * Providers - Sistema de abstracción para servicios externos
 *
 * Este módulo centraliza todos los providers (APIs externas) de Kaia
 * usando el patrón Factory para desacoplar la lógica de negocio
 * de las implementaciones específicas.
 */

// Interfaces
export * from './interfaces/base.provider.interface';
export * from './interfaces/ai.provider.interface';

// AI Providers
export { ClaudeProvider } from './ai/claude.provider';
export { GeminiProvider } from './ai/gemini.provider';

// Factories
export { AIProviderFactory, getAIProviderFactory, resetAIProviderFactory } from './factory/ai.factory';
