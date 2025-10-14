import { PrismaClient } from '@prisma/client';
import { IRepositoryObserver, RepositoryEvent } from './IRepository';

/**
 * Repositorio base abstracto
 * Todos los repositorios deben extender esta clase
 *
 * Proporciona:
 * - Métodos CRUD abstractos
 * - Sistema de observadores (para integración con IA)
 * - Helpers comunes
 */
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected observers: IRepositoryObserver[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Métodos CRUD abstractos (cada repo debe implementar)
  abstract create(data: any): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract findMany(filters: any): Promise<T[]>;

  /**
   * Agregar un observador
   * Útil para que el sistema de IA escuche cambios en la BD
   */
  attach(observer: IRepositoryObserver): void {
    this.observers.push(observer);
  }

  /**
   * Remover un observador
   */
  detach(observer: IRepositoryObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notificar a todos los observadores sobre un cambio
   * Se ejecuta en paralelo sin bloquear
   */
  protected async notifyObservers(event: RepositoryEvent): Promise<void> {
    await Promise.all(
      this.observers.map(observer =>
        observer.onRepositoryEvent(event).catch(err => {
          console.error('Observer error:', err);
        })
      )
    );
  }

  /**
   * Soft delete (marcar como eliminado sin borrar)
   * Requiere campo deletedAt en el modelo
   */
  protected async softDelete(tableName: string, id: string): Promise<void> {
    await (this.prisma as any)[tableName].update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Verificar si un registro existe
   */
  protected async exists(tableName: string, id: string): Promise<boolean> {
    const count = await (this.prisma as any)[tableName].count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * Contar registros con filtros
   */
  protected async count(tableName: string, filters: any): Promise<number> {
    return await (this.prisma as any)[tableName].count({ where: filters });
  }
}
