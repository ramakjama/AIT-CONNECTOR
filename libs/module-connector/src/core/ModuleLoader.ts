/**
 * Module Loader - Cargador dinámico de módulos con lazy loading y hot reload
 *
 * @module @ait-core/module-connector
 * @description Sistema avanzado de carga dinámica de módulos con optimizaciones
 */

import { EventEmitter } from 'eventemitter3';
import {
  Module,
  ModuleDefinition,
  LoadResult,
  UnloadResult,
  LoaderOptions,
  ModuleStatus
} from '../types';

interface LoadCache {
  module: Module;
  timestamp: number;
  loadTime: number;
}

interface LoadingState {
  promise: Promise<Module>;
  startTime: number;
  retries: number;
}

export class ModuleLoader extends EventEmitter {
  private loadedModules: Map<string, LoadCache> = new Map();
  private loadingStates: Map<string, LoadingState> = new Map();
  private preloadQueue: Set<string> = new Set();
  private options: Required<LoaderOptions>;

  // Performance monitoring
  private metrics = {
    totalLoads: 0,
    totalUnloads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    failedLoads: 0,
    avgLoadTime: 0,
    totalLoadTime: 0
  };

  constructor(options: LoaderOptions = {}) {
    super();
    this.options = {
      timeout: options.timeout || 30000,
      retry: options.retry || 3,
      cache: options.cache ?? true,
      preload: options.preload || []
    };

    this.initialize();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private async initialize(): Promise<void> {
    // Preload modules if specified
    if (this.options.preload.length > 0) {
      await this.preloadModules(this.options.preload);
    }

    // Setup cleanup interval
    this.setupCleanup();
  }

  // ============================================================================
  // MODULE LOADING
  // ============================================================================

  /**
   * Carga un módulo de forma dinámica con lazy loading
   */
  async loadModule(moduleId: string, definition?: ModuleDefinition): Promise<LoadResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (this.options.cache && this.loadedModules.has(moduleId)) {
        const cached = this.loadedModules.get(moduleId)!;
        this.metrics.cacheHits++;

        this.emit('module:loaded-from-cache', { moduleId, cached });

        return {
          module: cached.module,
          loadTime: Date.now() - startTime,
          fromCache: true
        };
      }

      this.metrics.cacheMisses++;

      // Check if already loading
      if (this.loadingStates.has(moduleId)) {
        const state = this.loadingStates.get(moduleId)!;
        const module = await state.promise;
        return {
          module,
          loadTime: Date.now() - startTime,
          fromCache: false
        };
      }

      // Start loading
      this.emit('module:loading', { moduleId });

      const loadPromise = this.performLoad(moduleId, definition);
      this.loadingStates.set(moduleId, {
        promise: loadPromise,
        startTime,
        retries: 0
      });

      try {
        const module = await this.withTimeout(loadPromise, this.options.timeout);

        // Cache the module
        const loadTime = Date.now() - startTime;
        if (this.options.cache) {
          this.loadedModules.set(moduleId, {
            module,
            timestamp: Date.now(),
            loadTime
          });
        }

        // Update metrics
        this.updateMetrics(loadTime);
        this.metrics.totalLoads++;

        // Cleanup loading state
        this.loadingStates.delete(moduleId);

        this.emit('module:loaded', { moduleId, module, loadTime });

        return {
          module,
          loadTime,
          fromCache: false
        };

      } catch (error) {
        this.loadingStates.delete(moduleId);
        this.metrics.failedLoads++;
        this.emit('module:load-error', { moduleId, error });
        throw error;
      }

    } catch (error: any) {
      throw new Error(`Failed to load module ${moduleId}: ${error.message}`);
    }
  }

  /**
   * Carga múltiples módulos en paralelo
   */
  async loadModules(moduleIds: string[]): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>();

    await Promise.all(
      moduleIds.map(async (id) => {
        try {
          const result = await this.loadModule(id);
          results.set(id, result);
        } catch (error) {
          console.error(`Failed to load module ${id}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Lazy loading de submódulo
   */
  async lazyLoadSubmodule(
    moduleId: string,
    submoduleId: string
  ): Promise<any> {
    const { module } = await this.loadModule(moduleId);

    if (!module.loadSubmodule) {
      throw new Error(`Module ${moduleId} does not support submodule loading`);
    }

    const submodule = await module.loadSubmodule(submoduleId);

    this.emit('submodule:loaded', { moduleId, submoduleId, submodule });

    return submodule;
  }

  // ============================================================================
  // MODULE UNLOADING
  // ============================================================================

  /**
   * Descarga un módulo de forma segura
   */
  async unloadModule(moduleId: string): Promise<UnloadResult> {
    const startTime = Date.now();

    try {
      const cached = this.loadedModules.get(moduleId);
      if (!cached) {
        return { success: true, cleanupTime: 0 };
      }

      this.emit('module:unloading', { moduleId });

      const { module } = cached;

      // Execute cleanup hook
      if (module.cleanup) {
        await this.withTimeout(
          module.cleanup(),
          5000 // 5 second timeout for cleanup
        );
      }

      // Remove from cache
      this.loadedModules.delete(moduleId);

      // Update metrics
      this.metrics.totalUnloads++;

      const cleanupTime = Date.now() - startTime;

      this.emit('module:unloaded', { moduleId, cleanupTime });

      return {
        success: true,
        cleanupTime
      };

    } catch (error: any) {
      this.emit('module:unload-error', { moduleId, error });

      return {
        success: false,
        cleanupTime: Date.now() - startTime,
        error
      };
    }
  }

  /**
   * Descarga múltiples módulos
   */
  async unloadModules(moduleIds: string[]): Promise<Map<string, UnloadResult>> {
    const results = new Map<string, UnloadResult>();

    // Unload sequentially to avoid race conditions
    for (const id of moduleIds) {
      const result = await this.unloadModule(id);
      results.set(id, result);
    }

    return results;
  }

  // ============================================================================
  // HOT RELOAD
  // ============================================================================

  /**
   * Recarga un módulo en caliente (hot reload)
   */
  async reloadModule(moduleId: string): Promise<LoadResult> {
    this.emit('module:reloading', { moduleId });

    // Unload first
    await this.unloadModule(moduleId);

    // Clear from cache to force reload
    this.loadedModules.delete(moduleId);

    // Load again
    const result = await this.loadModule(moduleId);

    this.emit('module:reloaded', { moduleId, result });

    return result;
  }

  /**
   * Hot Module Replacement (HMR) - avanzado
   */
  async hotModuleReplacement(
    moduleId: string,
    newModule: Module
  ): Promise<void> {
    const cached = this.loadedModules.get(moduleId);

    if (!cached) {
      throw new Error(`Module ${moduleId} not loaded`);
    }

    const oldModule = cached.module;

    // Execute HMR lifecycle
    if (oldModule.cleanup) {
      await oldModule.cleanup();
    }

    if (newModule.initialize) {
      await newModule.initialize();
    }

    // Update cache
    this.loadedModules.set(moduleId, {
      module: newModule,
      timestamp: Date.now(),
      loadTime: cached.loadTime
    });

    this.emit('module:hmr', { moduleId, oldModule, newModule });
  }

  // ============================================================================
  // PRELOADING
  // ============================================================================

  /**
   * Precarga módulos en segundo plano
   */
  async preloadModules(moduleIds: string[]): Promise<void> {
    this.emit('modules:preloading', { moduleIds });

    // Add to preload queue
    moduleIds.forEach(id => this.preloadQueue.add(id));

    // Load in background
    const results = await this.loadModules(moduleIds);

    // Remove from queue
    moduleIds.forEach(id => this.preloadQueue.delete(id));

    this.emit('modules:preloaded', { results });
  }

  /**
   * Precarga módulos críticos con prioridad
   */
  async preloadCritical(moduleIds: string[]): Promise<void> {
    // Load sequentially for critical modules
    for (const id of moduleIds) {
      await this.loadModule(id);
    }
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Obtiene un módulo cargado
   */
  getModule(moduleId: string): Module | undefined {
    return this.loadedModules.get(moduleId)?.module;
  }

  /**
   * Verifica si un módulo está cargado
   */
  isLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }

  /**
   * Verifica si un módulo está cargando
   */
  isLoading(moduleId: string): boolean {
    return this.loadingStates.has(moduleId);
  }

  /**
   * Obtiene todos los módulos cargados
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Obtiene métricas de rendimiento
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      failureRate: this.metrics.failedLoads / this.metrics.totalLoads || 0,
      loadedModules: this.loadedModules.size,
      loadingModules: this.loadingStates.size
    };
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Limpia la caché de módulos
   */
  clearCache(moduleId?: string): void {
    if (moduleId) {
      this.loadedModules.delete(moduleId);
      this.emit('cache:cleared', { moduleId });
    } else {
      this.loadedModules.clear();
      this.emit('cache:cleared-all');
    }
  }

  /**
   * Limpia módulos no usados recientemente
   */
  pruneCache(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    const pruned: string[] = [];

    for (const [id, cached] of this.loadedModules.entries()) {
      if (now - cached.timestamp > maxAge) {
        this.loadedModules.delete(id);
        pruned.push(id);
      }
    }

    if (pruned.length > 0) {
      this.emit('cache:pruned', { pruned, count: pruned.length });
    }
  }

  /**
   * Optimiza la caché manteniendo solo módulos activos
   */
  async optimizeCache(): Promise<void> {
    const before = this.loadedModules.size;

    // Keep only recently accessed modules
    this.pruneCache(1800000); // 30 minutes

    const after = this.loadedModules.size;
    const freed = before - after;

    this.emit('cache:optimized', { before, after, freed });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Realiza la carga efectiva del módulo
   */
  private async performLoad(
    moduleId: string,
    definition?: ModuleDefinition
  ): Promise<Module> {
    try {
      // Dynamic import con retry logic
      let module: any;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= this.options.retry; attempt++) {
        try {
          // Intentar diferentes estrategias de carga
          module = await this.tryLoadStrategies(moduleId);
          break;
        } catch (error: any) {
          lastError = error;
          if (attempt < this.options.retry) {
            await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
          }
        }
      }

      if (!module) {
        throw lastError || new Error(`Failed to load module ${moduleId}`);
      }

      // Get module instance
      const ModuleClass = module.default || module;
      const instance = typeof ModuleClass === 'function'
        ? new ModuleClass()
        : ModuleClass;

      // Initialize module
      if (instance.initialize) {
        await instance.initialize();
      }

      // Attach definition if provided
      if (definition) {
        instance.definition = definition;
      }

      return instance;

    } catch (error: any) {
      throw new Error(`Load failed for ${moduleId}: ${error.message}`);
    }
  }

  /**
   * Intenta diferentes estrategias de carga
   */
  private async tryLoadStrategies(moduleId: string): Promise<any> {
    const strategies = [
      // Strategy 1: Direct path
      () => import(`@modules/${moduleId}`),

      // Strategy 2: With extension
      () => import(`@modules/${moduleId}/index.js`),

      // Strategy 3: From lib
      () => import(`@ait-core/${moduleId}`),

      // Strategy 4: Dynamic path
      () => this.dynamicImport(moduleId)
    ];

    let lastError: Error | null = null;

    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error(`All load strategies failed for ${moduleId}`);
  }

  /**
   * Import dinámico con path resolver
   */
  private async dynamicImport(moduleId: string): Promise<any> {
    // Construct dynamic path
    const path = this.resolveModulePath(moduleId);
    return import(/* @vite-ignore */ path);
  }

  /**
   * Resuelve el path de un módulo
   */
  private resolveModulePath(moduleId: string): string {
    // Implement custom path resolution logic
    return `./modules/${moduleId}`;
  }

  /**
   * Wrapper para timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      )
    ]);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Actualiza métricas de rendimiento
   */
  private updateMetrics(loadTime: number): void {
    this.metrics.totalLoadTime += loadTime;
    this.metrics.avgLoadTime = this.metrics.totalLoadTime / this.metrics.totalLoads;
  }

  /**
   * Configura limpieza automática
   */
  private setupCleanup(): void {
    // Cleanup every 5 minutes
    setInterval(() => {
      this.pruneCache();
    }, 300000);
  }

  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================

  /**
   * Code splitting - carga solo lo necesario
   */
  async loadChunk(moduleId: string, chunkId: string): Promise<any> {
    const module = this.getModule(moduleId);

    if (!module) {
      throw new Error(`Module ${moduleId} not loaded`);
    }

    // Dynamic chunk loading
    const chunk = await import(
      /* @vite-ignore */
      `@modules/${moduleId}/chunks/${chunkId}`
    );

    this.emit('chunk:loaded', { moduleId, chunkId, chunk });

    return chunk;
  }

  /**
   * Prefetching - precarga inteligente basada en uso
   */
  async prefetch(moduleId: string): Promise<void> {
    // Start loading in background without blocking
    this.loadModule(moduleId).catch(() => {
      // Silent fail for prefetch
    });
  }

  /**
   * Module federation - carga módulos remotos
   */
  async loadRemoteModule(url: string, moduleId: string): Promise<Module> {
    try {
      // Load remote entry point
      const remoteEntry = await import(/* @vite-ignore */ url);

      // Get module factory
      const factory = await remoteEntry.get(moduleId);
      const module = factory();

      // Initialize
      if (module.initialize) {
        await module.initialize();
      }

      // Cache
      this.loadedModules.set(moduleId, {
        module,
        timestamp: Date.now(),
        loadTime: 0
      });

      this.emit('remote-module:loaded', { url, moduleId, module });

      return module;

    } catch (error: any) {
      throw new Error(`Failed to load remote module: ${error.message}`);
    }
  }

  /**
   * Batch loading optimization
   */
  async loadBatch(
    moduleIds: string[],
    options?: { parallel?: boolean; priority?: boolean }
  ): Promise<Map<string, LoadResult>> {
    const { parallel = true, priority = false } = options || {};

    if (priority) {
      // Sequential loading for priority
      const results = new Map<string, LoadResult>();
      for (const id of moduleIds) {
        const result = await this.loadModule(id);
        results.set(id, result);
      }
      return results;
    }

    if (parallel) {
      // Parallel loading
      return this.loadModules(moduleIds);
    }

    // Sequential loading
    const results = new Map<string, LoadResult>();
    for (const id of moduleIds) {
      const result = await this.loadModule(id);
      results.set(id, result);
    }
    return results;
  }

  /**
   * Limpia todos los recursos
   */
  async cleanup(): Promise<void> {
    const moduleIds = Array.from(this.loadedModules.keys());
    await this.unloadModules(moduleIds);
    this.loadedModules.clear();
    this.loadingStates.clear();
    this.preloadQueue.clear();
    this.removeAllListeners();
  }
}
