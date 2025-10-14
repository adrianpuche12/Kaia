/**
 * Sistema de EventBus para triggers y eventos del sistema AI
 * Permite suscripción, publicación y manejo de eventos
 */

/**
 * Trigger - Evento que ocurre en el sistema
 */
export interface ITrigger {
  id: string;
  type: string;
  source: string;
  userId: string;
  timestamp: Date;
  payload: any;
}

/**
 * Handler - Manejador de eventos
 */
export interface IEventHandler {
  handle(trigger: ITrigger): Promise<void>;
}

/**
 * EventBus
 * Sistema pub/sub para eventos del sistema
 */
export class EventBus {
  private handlers: Map<string, IEventHandler[]> = new Map();

  /**
   * Suscribirse a un tipo de evento
   * @param triggerType Tipo de trigger/evento
   * @param handler Handler que procesará el evento
   */
  subscribe(triggerType: string, handler: IEventHandler): void {
    const existing = this.handlers.get(triggerType) || [];
    this.handlers.set(triggerType, [...existing, handler]);
  }

  /**
   * Desuscribirse de un tipo de evento
   * @param triggerType Tipo de trigger/evento
   * @param handler Handler a remover
   */
  unsubscribe(triggerType: string, handler: IEventHandler): void {
    const existing = this.handlers.get(triggerType) || [];
    this.handlers.set(
      triggerType,
      existing.filter((h) => h !== handler)
    );
  }

  /**
   * Emitir un evento
   * @param trigger Trigger/evento a emitir
   */
  async emit(trigger: ITrigger): Promise<void> {
    const handlers = this.handlers.get(trigger.type) || [];

    // Ejecutar todos los handlers en paralelo
    await Promise.all(
      handlers.map((handler) =>
        handler.handle(trigger).catch((err) => {
          console.error(`Handler failed for ${trigger.type}:`, err);
        })
      )
    );
  }

  /**
   * Obtener cantidad de handlers registrados para un tipo de evento
   * @param triggerType Tipo de trigger/evento
   * @returns Número de handlers
   */
  getHandlerCount(triggerType: string): number {
    return (this.handlers.get(triggerType) || []).length;
  }

  /**
   * Limpiar todos los handlers
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Obtener todos los tipos de eventos registrados
   * @returns Array de tipos de eventos
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
