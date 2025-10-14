/**
 * Interfaces para el sistema de repositorios
 * Patrón Observer para notificar cambios en la BD
 */

export interface IRepositoryObserver {
  onRepositoryEvent(event: RepositoryEvent): Promise<void>;
}

export interface RepositoryEvent {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  userId: string;
  data: any;
  timestamp: Date;
}
