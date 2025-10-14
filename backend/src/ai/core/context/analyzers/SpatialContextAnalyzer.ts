import { ISpatialContext } from '../../interfaces/context/ISpatialContext';

/**
 * Analizador de Contexto Espacial
 * Analiza y enriquece el contexto espacial de una entidad
 * TODO: Implementar en futuro cuando se integre con Google Maps API
 */
export class SpatialContextAnalyzer {
  /**
   * Analizar contexto espacial
   * @param spatial Contexto espacial base
   * @param entity Entidad a analizar
   * @returns Contexto espacial enriquecido
   */
  async analyze(
    spatial: ISpatialContext,
    entity: any
  ): Promise<ISpatialContext> {
    // Por ahora retorna el contexto sin cambios
    // TODO: Agregar cálculos de distancia, proximidad, etc.
    return spatial;
  }
}
