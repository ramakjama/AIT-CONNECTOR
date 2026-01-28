/**
 * Module Registry - Registro central de módulos
 *
 * @module @ait-core/module-connector
 * @description Gestiona el catálogo de módulos disponibles y su metadata
 */

import { EventEmitter } from 'eventemitter3';
import {
  ModuleDefinition,
  ModuleCategory,
  ModuleStatus,
  ModuleFilter,
  ModuleSort
} from '../types';

export class ModuleRegistry extends EventEmitter {
  private modules: Map<string, ModuleDefinition> = new Map();
  private categoriesIndex: Map<ModuleCategory, Set<string>> = new Map();
  private statusIndex: Map<ModuleStatus, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeIndexes();
  }

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  /**
   * Registra un nuevo módulo
   */
  registerModule(module: ModuleDefinition): void {
    // Validación
    if (!module.id || !module.name || !module.version) {
      throw new Error('Invalid module definition: missing required fields');
    }

    if (this.modules.has(module.id)) {
      throw new Error(`Module ${module.id} already registered`);
    }

    // Guardar módulo
    this.modules.set(module.id, module);

    // Actualizar índices
    this.updateIndexes(module.id, module);

    // Emitir evento
    this.emit('module:registered', { moduleId: module.id, module });
  }

  /**
   * Des-registra un módulo
   */
  unregisterModule(id: string): void {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Module ${id} not found`);
    }

    // Remover de índices
    this.removeFromIndexes(id, module);

    // Eliminar módulo
    this.modules.delete(id);

    // Emitir evento
    this.emit('module:unregistered', { moduleId: id });
  }

  /**
   * Actualiza un módulo existente
   */
  updateModule(id: string, updates: Partial<ModuleDefinition>): void {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Module ${id} not found`);
    }

    // Actualizar módulo
    const updatedModule = { ...module, ...updates, id, lastUpdated: new Date() };
    this.modules.set(id, updatedModule);

    // Actualizar índices
    this.updateIndexes(id, updatedModule);

    // Emitir evento
    this.emit('module:updated', { moduleId: id, updates });
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Obtiene un módulo por ID
   */
  getModule(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  /**
   * Obtiene todos los módulos
   */
  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Obtiene módulos por categoría
   */
  getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
    const ids = this.categoriesIndex.get(category) || new Set();
    return Array.from(ids)
      .map(id => this.modules.get(id))
      .filter(Boolean) as ModuleDefinition[];
  }

  /**
   * Obtiene módulos por estado
   */
  getModulesByStatus(status: ModuleStatus): ModuleDefinition[] {
    const ids = this.statusIndex.get(status) || new Set();
    return Array.from(ids)
      .map(id => this.modules.get(id))
      .filter(Boolean) as ModuleDefinition[];
  }

  /**
   * Busca módulos con filtros
   */
  findModules(filter?: ModuleFilter, sort?: ModuleSort): ModuleDefinition[] {
    let results = this.getAllModules();

    // Aplicar filtros
    if (filter) {
      // Por estado
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        results = results.filter(m => statuses.includes(m.status));
      }

      // Por categoría
      if (filter.category) {
        const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
        results = results.filter(m => categories.includes(m.category));
      }

      // Por búsqueda de texto
      if (filter.search) {
        const search = filter.search.toLowerCase();
        results = results.filter(m =>
          m.name.toLowerCase().includes(search) ||
          m.displayName.toLowerCase().includes(search) ||
          m.description.toLowerCase().includes(search)
        );
      }

      // Por tags
      if (filter.tags && filter.tags.length > 0) {
        results = results.filter(m =>
          filter.tags!.some(tag => m.tags.includes(tag))
        );
      }

      // Por licencia
      if (filter.license) {
        const licenses = Array.isArray(filter.license) ? filter.license : [filter.license];
        results = results.filter(m => licenses.includes(m.license));
      }

      // Por rating mínimo
      if (filter.rating) {
        results = results.filter(m => m.rating >= filter.rating!);
      }
    }

    // Aplicar ordenamiento
    if (sort) {
      results.sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'rating':
            comparison = a.rating - b.rating;
            break;
          case 'downloads':
            comparison = a.downloads - b.downloads;
            break;
          case 'lastUpdated':
            comparison = (a.lastUpdated?.getTime() || 0) - (b.lastUpdated?.getTime() || 0);
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
        }

        return sort.order === 'desc' ? -comparison : comparison;
      });
    }

    return results;
  }

  /**
   * Verifica si un módulo existe
   */
  moduleExists(id: string): boolean {
    return this.modules.has(id);
  }

  /**
   * Obtiene el número total de módulos
   */
  getModuleCount(): number {
    return this.modules.size;
  }

  /**
   * Obtiene estadísticas de los módulos
   */
  getStatistics() {
    const stats = {
      total: this.modules.size,
      byStatus: {} as Record<ModuleStatus, number>,
      byCategory: {} as Record<ModuleCategory, number>,
      byLicense: {} as Record<string, number>
    };

    this.modules.forEach(module => {
      // Por estado
      stats.byStatus[module.status] = (stats.byStatus[module.status] || 0) + 1;

      // Por categoría
      stats.byCategory[module.category] = (stats.byCategory[module.category] || 0) + 1;

      // Por licencia
      stats.byLicense[module.license] = (stats.byLicense[module.license] || 0) + 1;
    });

    return stats;
  }

  // ============================================================================
  // DEPENDENCY QUERIES
  // ============================================================================

  /**
   * Obtiene módulos que dependen de un módulo dado
   */
  getDependentModules(moduleId: string): ModuleDefinition[] {
    return this.getAllModules().filter(module =>
      module.dependencies.some(dep => dep.moduleId === moduleId)
    );
  }

  /**
   * Obtiene módulos en conflicto con un módulo dado
   */
  getConflictingModules(moduleId: string): ModuleDefinition[] {
    const module = this.modules.get(moduleId);
    if (!module) return [];

    return this.getAllModules().filter(m =>
      module.conflicts.includes(m.id) || m.conflicts.includes(moduleId)
    );
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Registra múltiples módulos
   */
  registerModules(modules: ModuleDefinition[]): void {
    modules.forEach(module => this.registerModule(module));
  }

  /**
   * Actualiza múltiples módulos
   */
  updateModules(updates: Array<{ id: string; updates: Partial<ModuleDefinition> }>): void {
    updates.forEach(({ id, updates }) => this.updateModule(id, updates));
  }

  /**
   * Limpia el registro (útil para testing)
   */
  clear(): void {
    this.modules.clear();
    this.initializeIndexes();
    this.emit('registry:cleared');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private initializeIndexes(): void {
    // Inicializar índice de categorías
    Object.values(ModuleCategory).forEach(category => {
      this.categoriesIndex.set(category, new Set());
    });

    // Inicializar índice de estados
    Object.values(ModuleStatus).forEach(status => {
      this.statusIndex.set(status, new Set());
    });
  }

  private updateIndexes(id: string, module: ModuleDefinition): void {
    // Actualizar índice de categorías
    this.categoriesIndex.get(module.category)?.add(id);

    // Actualizar índice de estados
    this.statusIndex.get(module.status)?.add(id);
  }

  private removeFromIndexes(id: string, module: ModuleDefinition): void {
    // Remover de índice de categorías
    this.categoriesIndex.get(module.category)?.delete(id);

    // Remover de índice de estados
    this.statusIndex.get(module.status)?.delete(id);
  }

  // ============================================================================
  // IMPORT/EXPORT
  // ============================================================================

  /**
   * Exporta el registro a JSON
   */
  export(): string {
    const data = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      modules: Array.from(this.modules.values())
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Importa módulos desde JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);

      if (!data.modules || !Array.isArray(data.modules)) {
        throw new Error('Invalid import format');
      }

      data.modules.forEach((module: ModuleDefinition) => {
        this.registerModule(module);
      });

      this.emit('registry:imported', { count: data.modules.length });
    } catch (error) {
      throw new Error(`Failed to import modules: ${error.message}`);
    }
  }
}
