/**
 * Contexto Relacional
 * Dimensión 4: Información sobre relaciones con otras entidades
 */
export interface IRelationalContext {
  relationships: {
    parentId?: string;
    childrenIds: string[];
    relatedEntityIds: string[];
    conflictingEntityIds: string[]; // Entidades que entran en conflicto
  };

  clusters: {
    clusterId: string;
    clusterType: 'project' | 'routine' | 'goal' | 'context_based';
    clusterImportance: number; // 0-100
  }[];

  dependencies: {
    blockedBy: string[]; // Entidades que bloquean esta
    blocks: string[]; // Entidades que esta bloquea
    prerequisiteFor: string[]; // Entidades que requieren esta como prerequisito
  };
}
