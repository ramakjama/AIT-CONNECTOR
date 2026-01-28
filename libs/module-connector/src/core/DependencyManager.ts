/**
 * Dependency Manager - Gestor avanzado de dependencias con algoritmos optimizados
 *
 * @module @ait-core/module-connector
 * @description Sistema inteligente de resolución de dependencias con detección de conflictos
 */

import { EventEmitter } from 'eventemitter3';
import * as semver from 'semver';
import {
  ModuleDefinition,
  ModuleDependency,
  ResolvedDependencies,
  Conflict,
  DependencyTree,
  DependencyNode,
  DependencyType
} from '../types';

interface DependencyGraph {
  nodes: Map<string, DependencyGraphNode>;
  edges: Map<string, Set<string>>;
}

interface DependencyGraphNode {
  id: string;
  version: string;
  dependencies: ModuleDependency[];
  depth: number;
}

interface CircularDependency {
  cycle: string[];
  depth: number;
}

export class DependencyManager extends EventEmitter {
  private moduleRegistry: Map<string, ModuleDefinition> = new Map();
  private dependencyCache: Map<string, ResolvedDependencies> = new Map();
  private graphCache: Map<string, DependencyGraph> = new Map();

  // Advanced features
  private circularDependencies: Map<string, CircularDependency[]> = new Map();
  private dependencyStats = {
    totalResolutions: 0,
    cacheHits: 0,
    conflictsDetected: 0,
    circularDetected: 0
  };

  constructor(registry?: Map<string, ModuleDefinition>) {
    super();
    if (registry) {
      this.moduleRegistry = registry;
    }
  }

  // ============================================================================
  // DEPENDENCY RESOLUTION
  // ============================================================================

  /**
   * Resuelve todas las dependencias de un módulo con algoritmo optimizado
   */
  async resolveDependencies(moduleId: string): Promise<ResolvedDependencies> {
    this.dependencyStats.totalResolutions++;

    // Check cache first
    if (this.dependencyCache.has(moduleId)) {
      this.dependencyStats.cacheHits++;
      return this.dependencyCache.get(moduleId)!;
    }

    const module = this.moduleRegistry.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found in registry`);
    }

    const resolved: string[] = [];
    const toInstall: string[] = [];
    const conflicts: Conflict[] = [];

    // Build dependency graph
    const graph = await this.buildDependencyGraph(moduleId);

    // Topological sort for correct installation order
    const sortedDeps = this.topologicalSort(Array.from(graph.nodes.keys()));

    for (const depId of sortedDeps) {
      if (depId === moduleId) continue;

      const node = graph.nodes.get(depId);
      if (!node) continue;

      const depModule = this.moduleRegistry.get(depId);

      if (depModule) {
        // Check version compatibility
        const requiredVersion = this.getRequiredVersion(moduleId, depId);
        if (requiredVersion) {
          if (this.isVersionCompatible(depModule.version, requiredVersion)) {
            resolved.push(depId);
          } else {
            conflicts.push({
              moduleId: depId,
              required: requiredVersion,
              installed: depModule.version,
              type: 'version-mismatch',
              message: `Version mismatch: required ${requiredVersion}, installed ${depModule.version}`
            });
          }
        } else {
          resolved.push(depId);
        }
      } else {
        toInstall.push(depId);
      }
    }

    // Detect conflicts
    const moduleConflicts = await this.detectAllConflicts(moduleId, graph);
    conflicts.push(...moduleConflicts);

    // Detect circular dependencies
    const circular = this.detectCircularDependencies(moduleId, graph);
    if (circular.length > 0) {
      this.dependencyStats.circularDetected++;
      circular.forEach(cycle => {
        conflicts.push({
          moduleId: cycle.cycle.join(' -> '),
          type: 'circular',
          message: `Circular dependency detected: ${cycle.cycle.join(' -> ')}`
        });
      });
    }

    if (conflicts.length > 0) {
      this.dependencyStats.conflictsDetected++;
    }

    const result: ResolvedDependencies = {
      resolved,
      toInstall,
      conflicts,
      canProceed: conflicts.filter(c => c.type !== 'circular').length === 0
    };

    // Cache result
    this.dependencyCache.set(moduleId, result);

    this.emit('dependencies:resolved', { moduleId, result });

    return result;
  }

  /**
   * Resuelve dependencias para múltiples módulos en batch
   */
  async resolveBatch(moduleIds: string[]): Promise<Map<string, ResolvedDependencies>> {
    const results = new Map<string, ResolvedDependencies>();

    await Promise.all(
      moduleIds.map(async (id) => {
        try {
          const result = await this.resolveDependencies(id);
          results.set(id, result);
        } catch (error) {
          console.error(`Failed to resolve dependencies for ${id}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Resuelve dependencias con estrategias de resolución avanzadas
   */
  async resolveWithStrategy(
    moduleId: string,
    strategy: 'strict' | 'lenient' | 'auto' = 'auto'
  ): Promise<ResolvedDependencies> {
    const baseResult = await this.resolveDependencies(moduleId);

    switch (strategy) {
      case 'strict':
        // Fail on any conflict
        if (baseResult.conflicts.length > 0) {
          throw new Error(`Strict mode: conflicts detected for ${moduleId}`);
        }
        return baseResult;

      case 'lenient':
        // Allow minor version mismatches
        baseResult.conflicts = baseResult.conflicts.filter(c =>
          c.type !== 'version-mismatch' ||
          !this.isMinorVersionCompatible(c.installed!, c.required!)
        );
        baseResult.canProceed = baseResult.conflicts.length === 0;
        return baseResult;

      case 'auto':
      default:
        // Auto-resolve when possible
        return this.autoResolveConflicts(baseResult);
    }
  }

  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  /**
   * Detecta todos los tipos de conflictos
   */
  async detectAllConflicts(
    moduleId: string,
    graph?: DependencyGraph
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Version conflicts
    conflicts.push(...await this.detectVersionConflicts(moduleId));

    // Incompatibility conflicts
    conflicts.push(...this.detectIncompatibilities(moduleId));

    // Peer dependency conflicts
    conflicts.push(...this.detectPeerConflicts(moduleId));

    // Platform conflicts
    conflicts.push(...this.detectPlatformConflicts(moduleId));

    return conflicts;
  }

  /**
   * Detecta conflictos de versión entre dependencias
   */
  async detectVersionConflicts(moduleId: string): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const module = this.moduleRegistry.get(moduleId);

    if (!module) return conflicts;

    // Build version requirement map
    const versionMap = new Map<string, Set<string>>();

    module.dependencies.forEach(dep => {
      if (!versionMap.has(dep.moduleId)) {
        versionMap.set(dep.moduleId, new Set());
      }
      versionMap.get(dep.moduleId)!.add(dep.version);
    });

    // Check for conflicting versions
    for (const [depId, versions] of versionMap) {
      if (versions.size > 1) {
        const versionsArray = Array.from(versions);
        const compatible = this.areVersionsCompatible(versionsArray);

        if (!compatible) {
          conflicts.push({
            moduleId: depId,
            type: 'version-mismatch',
            message: `Multiple incompatible versions required: ${versionsArray.join(', ')}`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detecta incompatibilidades explícitas
   */
  detectIncompatibilities(moduleId: string): Conflict[] {
    const conflicts: Conflict[] = [];
    const module = this.moduleRegistry.get(moduleId);

    if (!module) return conflicts;

    // Check explicit conflicts
    for (const conflictId of module.conflicts) {
      const conflictModule = this.moduleRegistry.get(conflictId);

      if (conflictModule) {
        conflicts.push({
          moduleId: conflictId,
          type: 'incompatible',
          message: `Module ${moduleId} is incompatible with ${conflictId}`
        });
      }
    }

    return conflicts;
  }

  /**
   * Detecta conflictos en peer dependencies
   */
  detectPeerConflicts(moduleId: string): Conflict[] {
    const conflicts: Conflict[] = [];
    const module = this.moduleRegistry.get(moduleId);

    if (!module) return conflicts;

    const peerDeps = module.dependencies.filter(d => d.type === DependencyType.PEER);

    for (const peer of peerDeps) {
      const peerModule = this.moduleRegistry.get(peer.moduleId);

      if (!peerModule) {
        if (peer.required) {
          conflicts.push({
            moduleId: peer.moduleId,
            type: 'missing',
            required: peer.version,
            message: `Required peer dependency ${peer.moduleId} not found`
          });
        }
      } else {
        // Check version match (peer deps require exact match)
        if (!semver.satisfies(peerModule.version, peer.version)) {
          conflicts.push({
            moduleId: peer.moduleId,
            type: 'version-mismatch',
            required: peer.version,
            installed: peerModule.version,
            message: `Peer dependency version mismatch`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detecta conflictos de plataforma/entorno
   */
  detectPlatformConflicts(moduleId: string): Conflict[] {
    const conflicts: Conflict[] = [];
    const module = this.moduleRegistry.get(moduleId);

    if (!module) return conflicts;

    // Check platform requirements (extensible)
    const platform = this.getCurrentPlatform();

    if (module.config?.requiredPlatform) {
      if (module.config.requiredPlatform !== platform) {
        conflicts.push({
          moduleId,
          type: 'incompatible',
          message: `Module requires platform ${module.config.requiredPlatform}, current: ${platform}`
        });
      }
    }

    return conflicts;
  }

  // ============================================================================
  // CIRCULAR DEPENDENCY DETECTION
  // ============================================================================

  /**
   * Detecta dependencias circulares usando DFS
   */
  detectCircularDependencies(
    moduleId: string,
    graph?: DependencyGraph
  ): CircularDependency[] {
    const circles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const depGraph = graph || this.buildSimpleGraph(moduleId);

    const dfs = (nodeId: string, depth: number = 0) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = depGraph.nodes.get(nodeId);
      if (node) {
        for (const dep of node.dependencies) {
          if (!visited.has(dep.moduleId)) {
            dfs(dep.moduleId, depth + 1);
          } else if (recursionStack.has(dep.moduleId)) {
            // Circular dependency found
            const cycleStart = path.indexOf(dep.moduleId);
            const cycle = [...path.slice(cycleStart), dep.moduleId];

            circles.push({
              cycle,
              depth
            });
          }
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    dfs(moduleId);

    // Cache circular dependencies
    if (circles.length > 0) {
      this.circularDependencies.set(moduleId, circles);
    }

    return circles;
  }

  /**
   * Detecta ciclos usando algoritmo de Tarjan (más eficiente)
   */
  detectCyclesTarjan(graph: DependencyGraph): string[][] {
    const index = new Map<string, number>();
    const lowLink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const scc: string[][] = [];
    let currentIndex = 0;

    const strongConnect = (nodeId: string) => {
      index.set(nodeId, currentIndex);
      lowLink.set(nodeId, currentIndex);
      currentIndex++;
      stack.push(nodeId);
      onStack.add(nodeId);

      const edges = graph.edges.get(nodeId);
      if (edges) {
        for (const neighborId of edges) {
          if (!index.has(neighborId)) {
            strongConnect(neighborId);
            lowLink.set(nodeId, Math.min(lowLink.get(nodeId)!, lowLink.get(neighborId)!));
          } else if (onStack.has(neighborId)) {
            lowLink.set(nodeId, Math.min(lowLink.get(nodeId)!, index.get(neighborId)!));
          }
        }
      }

      if (lowLink.get(nodeId) === index.get(nodeId)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== nodeId);

        if (component.length > 1) {
          scc.push(component);
        }
      }
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!index.has(nodeId)) {
        strongConnect(nodeId);
      }
    }

    return scc;
  }

  // ============================================================================
  // DEPENDENCY TREE
  // ============================================================================

  /**
   * Construye árbol de dependencias completo
   */
  buildDependencyTree(moduleId: string): DependencyTree {
    const visited = new Set<string>();
    const totalDeps = new Set<string>();

    const buildNode = (id: string, depth: number = 0): DependencyNode => {
      if (visited.has(id)) {
        return {
          id,
          circular: true,
          depth
        };
      }

      visited.add(id);
      const module = this.moduleRegistry.get(id);

      if (!module) {
        return {
          id,
          name: 'Unknown',
          version: '0.0.0',
          depth
        };
      }

      const children = module.dependencies.map(dep => {
        totalDeps.add(dep.moduleId);
        return buildNode(dep.moduleId, depth + 1);
      });

      return {
        id,
        name: module.name,
        version: module.version,
        depth,
        children: children.length > 0 ? children : undefined
      };
    };

    const root = buildNode(moduleId);

    return {
      root,
      totalDependencies: totalDeps.size
    };
  }

  /**
   * Construye árbol optimizado con información adicional
   */
  buildEnhancedTree(moduleId: string): any {
    const tree = this.buildDependencyTree(moduleId);

    // Add metadata
    const enhance = (node: DependencyNode): any => {
      const module = this.moduleRegistry.get(node.id);

      return {
        ...node,
        category: module?.category,
        license: module?.license,
        size: this.estimateModuleSize(node.id),
        loadTime: this.estimateLoadTime(node.id),
        children: node.children?.map(enhance)
      };
    };

    return {
      ...tree,
      root: enhance(tree.root),
      metadata: {
        totalSize: this.calculateTotalSize(tree.root),
        estimatedLoadTime: this.calculateTotalLoadTime(tree.root),
        depth: this.calculateMaxDepth(tree.root)
      }
    };
  }

  // ============================================================================
  // TOPOLOGICAL SORT
  // ============================================================================

  /**
   * Ordenamiento topológico usando algoritmo de Kahn optimizado
   */
  topologicalSort(moduleIds: string[]): string[] {
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize graph
    for (const id of moduleIds) {
      const module = this.moduleRegistry.get(id);
      if (!module) continue;

      graph.set(id, new Set());
      inDegree.set(id, 0);

      for (const dep of module.dependencies) {
        if (moduleIds.includes(dep.moduleId)) {
          if (!graph.has(dep.moduleId)) {
            graph.set(dep.moduleId, new Set());
            inDegree.set(dep.moduleId, 0);
          }
          graph.get(id)!.add(dep.moduleId);
        }
      }
    }

    // Calculate in-degrees
    for (const edges of graph.values()) {
      for (const target of edges) {
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      }
    }

    // Kahn's algorithm with priority queue
    const queue: string[] = [];
    const result: string[] = [];

    // Add nodes with no incoming edges
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    // Sort queue by priority (optional: dependencies first)
    queue.sort((a, b) => {
      const moduleA = this.moduleRegistry.get(a);
      const moduleB = this.moduleRegistry.get(b);
      return (moduleA?.config?.priority || 0) - (moduleB?.config?.priority || 0);
    });

    while (queue.length > 0) {
      const id = queue.shift()!;
      result.push(id);

      const edges = graph.get(id);
      if (edges) {
        for (const target of edges) {
          const newDegree = inDegree.get(target)! - 1;
          inDegree.set(target, newDegree);

          if (newDegree === 0) {
            queue.push(target);
          }
        }
      }
    }

    // Check for cycles
    if (result.length !== moduleIds.length) {
      throw new Error('Circular dependency detected - cannot perform topological sort');
    }

    return result;
  }

  /**
   * Ordenamiento topológico con niveles (layer-by-layer)
   */
  topologicalSortLevels(moduleIds: string[]): string[][] {
    const sorted = this.topologicalSort(moduleIds);
    const levels: string[][] = [];
    const level = new Map<string, number>();

    // Calculate level for each module
    for (const id of sorted) {
      const module = this.moduleRegistry.get(id);
      if (!module) continue;

      let maxDepLevel = 0;
      for (const dep of module.dependencies) {
        if (level.has(dep.moduleId)) {
          maxDepLevel = Math.max(maxDepLevel, level.get(dep.moduleId)! + 1);
        }
      }

      level.set(id, maxDepLevel);

      if (!levels[maxDepLevel]) {
        levels[maxDepLevel] = [];
      }
      levels[maxDepLevel].push(id);
    }

    return levels;
  }

  // ============================================================================
  // VERSION COMPATIBILITY
  // ============================================================================

  /**
   * Verifica compatibilidad de versiones usando semver
   */
  isVersionCompatible(installed: string, required: string): boolean {
    try {
      return semver.satisfies(installed, required);
    } catch {
      // Fallback to simple comparison
      return installed === required;
    }
  }

  /**
   * Verifica compatibilidad de versiones menores
   */
  isMinorVersionCompatible(installed: string, required: string): boolean {
    try {
      const installedSemver = semver.parse(installed);
      const requiredSemver = semver.parse(required);

      if (!installedSemver || !requiredSemver) return false;

      return (
        installedSemver.major === requiredSemver.major &&
        installedSemver.minor >= requiredSemver.minor
      );
    } catch {
      return false;
    }
  }

  /**
   * Verifica si múltiples versiones son compatibles entre sí
   */
  areVersionsCompatible(versions: string[]): boolean {
    if (versions.length <= 1) return true;

    const ranges = versions.map(v => semver.validRange(v)).filter(Boolean);

    // Check if all ranges can be satisfied by a common version
    for (let i = 0; i < ranges.length - 1; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (!semver.intersects(ranges[i]!, ranges[j]!)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Encuentra la mejor versión compatible
   */
  findBestVersion(versions: string[]): string | null {
    if (versions.length === 0) return null;
    if (versions.length === 1) return versions[0];

    try {
      // Sort versions and return highest
      return semver.sort(versions).reverse()[0];
    } catch {
      return versions[0];
    }
  }

  // ============================================================================
  // AUTO-RESOLUTION
  // ============================================================================

  /**
   * Auto-resuelve conflictos cuando es posible
   */
  async autoResolveConflicts(
    result: ResolvedDependencies
  ): Promise<ResolvedDependencies> {
    const resolvedConflicts: Conflict[] = [];

    for (const conflict of result.conflicts) {
      try {
        if (conflict.type === 'version-mismatch') {
          // Try to find compatible version
          const compatible = this.findCompatibleVersion(
            conflict.moduleId,
            [conflict.required!, conflict.installed!]
          );

          if (compatible) {
            // Conflict can be auto-resolved
            continue;
          }
        }
      } catch {
        // Cannot auto-resolve
      }

      resolvedConflicts.push(conflict);
    }

    return {
      ...result,
      conflicts: resolvedConflicts,
      canProceed: resolvedConflicts.length === 0
    };
  }

  /**
   * Encuentra versión compatible entre requisitos
   */
  findCompatibleVersion(moduleId: string, versions: string[]): string | null {
    const module = this.moduleRegistry.get(moduleId);
    if (!module) return null;

    // Check if current version satisfies all requirements
    const allSatisfied = versions.every(v =>
      this.isVersionCompatible(module.version, v)
    );

    return allSatisfied ? module.version : null;
  }

  // ============================================================================
  // GRAPH BUILDING
  // ============================================================================

  /**
   * Construye grafo de dependencias completo
   */
  async buildDependencyGraph(moduleId: string): Promise<DependencyGraph> {
    // Check cache
    if (this.graphCache.has(moduleId)) {
      return this.graphCache.get(moduleId)!;
    }

    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map()
    };

    const visited = new Set<string>();

    const buildGraph = (id: string, depth: number = 0) => {
      if (visited.has(id)) return;
      visited.add(id);

      const module = this.moduleRegistry.get(id);
      if (!module) return;

      // Add node
      graph.nodes.set(id, {
        id,
        version: module.version,
        dependencies: module.dependencies,
        depth
      });

      // Add edges
      if (!graph.edges.has(id)) {
        graph.edges.set(id, new Set());
      }

      for (const dep of module.dependencies) {
        graph.edges.get(id)!.add(dep.moduleId);
        buildGraph(dep.moduleId, depth + 1);
      }
    };

    buildGraph(moduleId);

    // Cache graph
    this.graphCache.set(moduleId, graph);

    return graph;
  }

  /**
   * Construye grafo simple sin profundidad
   */
  buildSimpleGraph(moduleId: string): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map()
    };

    const module = this.moduleRegistry.get(moduleId);
    if (!module) return graph;

    graph.nodes.set(moduleId, {
      id: moduleId,
      version: module.version,
      dependencies: module.dependencies,
      depth: 0
    });

    graph.edges.set(moduleId, new Set(module.dependencies.map(d => d.moduleId)));

    return graph;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getRequiredVersion(moduleId: string, depId: string): string | null {
    const module = this.moduleRegistry.get(moduleId);
    if (!module) return null;

    const dep = module.dependencies.find(d => d.moduleId === depId);
    return dep?.version || null;
  }

  private getCurrentPlatform(): string {
    return typeof window !== 'undefined' ? 'browser' : 'node';
  }

  private estimateModuleSize(moduleId: string): number {
    // Placeholder - implement actual size estimation
    return 1000;
  }

  private estimateLoadTime(moduleId: string): number {
    // Placeholder - implement actual load time estimation
    return 100;
  }

  private calculateTotalSize(node: DependencyNode): number {
    let size = this.estimateModuleSize(node.id);
    if (node.children) {
      size += node.children.reduce((sum, child) => sum + this.calculateTotalSize(child), 0);
    }
    return size;
  }

  private calculateTotalLoadTime(node: DependencyNode): number {
    let time = this.estimateLoadTime(node.id);
    if (node.children) {
      time += node.children.reduce((sum, child) => sum + this.calculateTotalLoadTime(child), 0);
    }
    return time;
  }

  private calculateMaxDepth(node: DependencyNode): number {
    if (!node.children || node.children.length === 0) {
      return node.depth;
    }
    return Math.max(...node.children.map(child => this.calculateMaxDepth(child)));
  }

  /**
   * Obtiene estadísticas del gestor
   */
  getStats() {
    return {
      ...this.dependencyStats,
      cacheHitRate: this.dependencyStats.cacheHits / this.dependencyStats.totalResolutions || 0,
      conflictRate: this.dependencyStats.conflictsDetected / this.dependencyStats.totalResolutions || 0,
      cachedResolutions: this.dependencyCache.size,
      cachedGraphs: this.graphCache.size
    };
  }

  /**
   * Limpia cachés
   */
  clearCaches(): void {
    this.dependencyCache.clear();
    this.graphCache.clear();
    this.circularDependencies.clear();
    this.emit('caches:cleared');
  }

  /**
   * Actualiza el registro de módulos
   */
  updateRegistry(registry: Map<string, ModuleDefinition>): void {
    this.moduleRegistry = registry;
    this.clearCaches(); // Clear caches when registry changes
    this.emit('registry:updated');
  }
}
