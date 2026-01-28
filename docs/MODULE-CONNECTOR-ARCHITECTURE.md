# 🔌 MODULE CONNECTOR - ARQUITECTURA DEL SISTEMA
## Sistema de Conexión/Desconexión de Módulos para AIT-CORE ERP

> **AI Innovation Technologies**
> Versión: 2.0.0 | Fecha: 28 Enero 2026

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Flujo de Conexión/Desconexión](#flujo-de-conexióndesconexión)
5. [Dashboard Visual](#dashboard-visual)
6. [Configurador de Módulos](#configurador-de-módulos)
7. [Sistema de KPIs](#sistema-de-kpis)
8. [API y Endpoints](#api-y-endpoints)
9. [Seguridad y Permisos](#seguridad-y-permisos)
10. [Casos de Uso](#casos-de-uso)

---

## 🎯 VISIÓN GENERAL

### Concepto
El **MODULE CONNECTOR** es el núcleo central del sistema AIT-CORE ERP que permite:
- Conectar y desconectar módulos de forma dinámica
- Gestión visual de dependencias entre módulos
- Configuración granular de submódulos y herramientas
- Monitorización en tiempo real del estado del sistema
- KPIs y métricas de uso de módulos

### Características Principales
```yaml
Características:
  - Conexión/Desconexión dinámica en runtime
  - Zero downtime deployment
  - Hot reload de módulos
  - Gestión de dependencias automática
  - Rollback automático en caso de error
  - Backup automático antes de cambios
  - Sistema de permisos granular
  - Marketplace de módulos integrado
  - Dashboard visual profesional
  - KPIs en tiempo real
  - Configurador de flows visual
  - Sistema de notificaciones
  - Auditoría completa de cambios
  - Multi-tenancy support
  - High availability
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    MODULE CONNECTOR CORE                     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              MODULE REGISTRY                           │  │
│  │  - Catálogo de módulos                                 │  │
│  │  - Metadata de módulos                                 │  │
│  │  - Versiones y dependencias                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                   │
│  ┌────────────┬──────────┴──────────┬────────────┐          │
│  │            │                      │            │          │
│  ▼            ▼                      ▼            ▼          │
│ ┌───────┐  ┌───────┐            ┌───────┐  ┌───────┐       │
│ │LOADER │  │ROUTER │            │VALIDATOR│ │MONITOR│       │
│ │       │  │       │            │         │ │       │       │
│ │-Dynamic│ │-Route │            │-Health  │ │-Metrics│      │
│ │ Import │ │ Mgmt  │            │ Checks  │ │-Alerts │      │
│ │-Lazy   │ │-API   │            │-Deps    │ │-Logs   │      │
│ │ Load   │ │ Guard │            │-Conflict│ │-Events │      │
│ └───────┘  └───────┘            └───────┘  └───────┘       │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│   FRONTEND    │  │   DASHBOARD    │  │  CONFIGURATOR  │
│               │  │                │  │                │
│ - UI Library  │  │ - KPIs Visual  │  │ - Flow Builder │
│ - Components  │  │ - Charts       │  │ - Dep Graph    │
│ - Widgets     │  │ - Real-time    │  │ - Settings     │
└───────────────┘  └────────────────┘  └────────────────┘
```

### Arquitectura de Capas

```
╔═══════════════════════════════════════════════════════════╗
║                    PRESENTATION LAYER                      ║
║  - Dashboard UI                                            ║
║  - Module Configurator                                     ║
║  - KPI Visualizer                                          ║
║  - Flow Designer                                           ║
╠═══════════════════════════════════════════════════════════╣
║                    APPLICATION LAYER                       ║
║  - Module Controller                                       ║
║  - Dependency Manager                                      ║
║  - State Manager                                           ║
║  - Event Bus                                               ║
╠═══════════════════════════════════════════════════════════╣
║                    BUSINESS LOGIC LAYER                    ║
║  - Module Loader                                           ║
║  - Module Validator                                        ║
║  - Connection Logic                                        ║
║  - Rollback Logic                                          ║
╠═══════════════════════════════════════════════════════════╣
║                    DATA ACCESS LAYER                       ║
║  - Module Repository                                       ║
║  - Configuration Store                                     ║
║  - Metrics Collector                                       ║
║  - Event Store                                             ║
╠═══════════════════════════════════════════════════════════╣
║                    INFRASTRUCTURE LAYER                    ║
║  - Database (PostgreSQL)                                   ║
║  - Cache (Redis)                                           ║
║  - Queue (RabbitMQ)                                        ║
║  - Storage (S3)                                            ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🔧 COMPONENTES PRINCIPALES

### 1. MODULE REGISTRY

**Responsabilidades:**
- Mantener catálogo de módulos disponibles
- Gestionar metadata de módulos
- Tracking de versiones
- Gestión de dependencias
- Estado de módulos

**Estructura de Datos:**
```typescript
interface ModuleDefinition {
  // Identificación
  id: string;
  name: string;
  version: string;
  category: ModuleCategory;

  // Metadata
  displayName: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];

  // Estado
  status: 'active' | 'inactive' | 'disabled' | 'error';
  installedAt?: Date;
  lastUpdated?: Date;

  // Dependencias
  dependencies: ModuleDependency[];
  conflicts: string[];
  requiredBy: string[];

  // Configuración
  config: ModuleConfig;
  settings: ModuleSettings;

  // Submódulos
  submodules: SubmoduleDefinition[];
  tools: ToolDefinition[];

  // Licencia y Permisos
  license: 'free' | 'premium' | 'enterprise';
  permissions: Permission[];

  // Marketplace
  author: string;
  rating: number;
  downloads: number;
  price?: number;
}

interface ModuleDependency {
  moduleId: string;
  version: string;
  required: boolean;
  type: 'hard' | 'soft' | 'peer';
}

interface SubmoduleDefinition {
  id: string;
  name: string;
  parentId: string;
  status: ModuleStatus;
  config: SubmoduleConfig;
  tools: ToolDefinition[];
}

interface ToolDefinition {
  id: string;
  name: string;
  type: 'dashboard' | 'report' | 'analyzer' | 'calculator' | 'integration';
  icon: string;
  enabled: boolean;
}
```

### 2. MODULE LOADER

**Responsabilidades:**
- Carga dinámica de módulos
- Lazy loading
- Code splitting
- Hot module replacement
- Precarga de módulos críticos

**Implementación:**
```typescript
class ModuleLoader {
  private loadedModules: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * Carga un módulo de forma dinámica
   */
  async loadModule(moduleId: string): Promise<Module> {
    // Check if already loaded
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId);
    }

    // Check if already loading
    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId);
    }

    // Start loading
    const loadPromise = this.performLoad(moduleId);
    this.loadingPromises.set(moduleId, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedModules.set(moduleId, module);
      this.loadingPromises.delete(moduleId);

      // Trigger events
      this.eventBus.emit('module:loaded', { moduleId, module });

      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      this.eventBus.emit('module:load-error', { moduleId, error });
      throw error;
    }
  }

  /**
   * Descarga un módulo de forma segura
   */
  async unloadModule(moduleId: string): Promise<void> {
    const module = this.loadedModules.get(moduleId);
    if (!module) return;

    // Check dependencies
    const dependents = this.getDependentModules(moduleId);
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unload module ${moduleId}. Required by: ${dependents.join(', ')}`
      );
    }

    // Cleanup
    await module.cleanup?.();

    // Remove from cache
    this.loadedModules.delete(moduleId);

    // Trigger events
    this.eventBus.emit('module:unloaded', { moduleId });
  }

  /**
   * Recarga un módulo (hot reload)
   */
  async reloadModule(moduleId: string): Promise<Module> {
    await this.unloadModule(moduleId);
    return this.loadModule(moduleId);
  }

  /**
   * Carga perezosa de submódulos
   */
  async lazyLoadSubmodule(
    moduleId: string,
    submoduleId: string
  ): Promise<Submodule> {
    const module = await this.loadModule(moduleId);
    return module.loadSubmodule(submoduleId);
  }

  private async performLoad(moduleId: string): Promise<Module> {
    // Dynamic import
    const moduleDef = await import(`@modules/${moduleId}`);

    // Initialize module
    const module = new moduleDef.default();
    await module.initialize?.();

    return module;
  }

  private getDependentModules(moduleId: string): string[] {
    return Array.from(this.loadedModules.entries())
      .filter(([_, mod]) => mod.dependencies?.includes(moduleId))
      .map(([id]) => id);
  }
}
```

### 3. DEPENDENCY MANAGER

**Responsabilidades:**
- Resolución de dependencias
- Detección de conflictos
- Validación de versiones
- Árbol de dependencias
- Ordenamiento topológico

**Implementación:**
```typescript
class DependencyManager {
  private registry: ModuleRegistry;

  /**
   * Resuelve dependencias de un módulo
   */
  async resolveDependencies(
    moduleId: string
  ): Promise<ResolvedDependencies> {
    const module = await this.registry.getModule(moduleId);
    const dependencies = module.dependencies;

    const resolved: string[] = [];
    const toInstall: string[] = [];
    const conflicts: Conflict[] = [];

    for (const dep of dependencies) {
      const depModule = await this.registry.getModule(dep.moduleId);

      // Check if already installed
      if (depModule.status === 'active') {
        // Check version compatibility
        if (this.isVersionCompatible(depModule.version, dep.version)) {
          resolved.push(dep.moduleId);
        } else {
          conflicts.push({
            moduleId: dep.moduleId,
            required: dep.version,
            installed: depModule.version,
            type: 'version-mismatch'
          });
        }
      } else {
        toInstall.push(dep.moduleId);
      }

      // Check for conflicts
      const moduleConflicts = this.detectConflicts(dep.moduleId);
      conflicts.push(...moduleConflicts);
    }

    return {
      resolved,
      toInstall,
      conflicts,
      canProceed: conflicts.length === 0
    };
  }

  /**
   * Detecta conflictos entre módulos
   */
  detectConflicts(moduleId: string): Conflict[] {
    const module = this.registry.getModule(moduleId);
    const conflicts: Conflict[] = [];

    for (const conflictId of module.conflicts) {
      const conflictModule = this.registry.getModule(conflictId);
      if (conflictModule.status === 'active') {
        conflicts.push({
          moduleId: conflictId,
          type: 'incompatible',
          message: `Module ${moduleId} conflicts with ${conflictId}`
        });
      }
    }

    return conflicts;
  }

  /**
   * Construye árbol de dependencias
   */
  buildDependencyTree(moduleId: string): DependencyTree {
    const visited = new Set<string>();

    const buildTree = (id: string, depth: number = 0): DependencyNode => {
      if (visited.has(id)) {
        return { id, circular: true, depth };
      }

      visited.add(id);
      const module = this.registry.getModule(id);

      return {
        id,
        name: module.name,
        version: module.version,
        depth,
        children: module.dependencies.map(dep =>
          buildTree(dep.moduleId, depth + 1)
        )
      };
    };

    return {
      root: buildTree(moduleId),
      totalDependencies: visited.size - 1
    };
  }

  /**
   * Ordena módulos por dependencias (topological sort)
   */
  topologicalSort(moduleIds: string[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Build graph
    for (const id of moduleIds) {
      const module = this.registry.getModule(id);
      graph.set(id, module.dependencies.map(d => d.moduleId));
      inDegree.set(id, 0);
    }

    // Calculate in-degrees
    for (const deps of graph.values()) {
      for (const dep of deps) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    while (queue.length > 0) {
      const id = queue.shift()!;
      result.push(id);

      for (const dep of graph.get(id) || []) {
        const newDegree = inDegree.get(dep)! - 1;
        inDegree.set(dep, newDegree);
        if (newDegree === 0) queue.push(dep);
      }
    }

    // Check for cycles
    if (result.length !== moduleIds.length) {
      throw new Error('Circular dependency detected');
    }

    return result;
  }

  private isVersionCompatible(installed: string, required: string): boolean {
    // Semantic versioning check
    const [reqMajor, reqMinor] = required.split('.').map(Number);
    const [instMajor, instMinor] = installed.split('.').map(Number);

    // Major version must match
    if (reqMajor !== instMajor) return false;

    // Minor version must be >= required
    return instMinor >= reqMinor;
  }
}
```

### 4. MODULE VALIDATOR

**Responsabilidades:**
- Validación de módulos
- Health checks
- Pruebas de compatibilidad
- Verificación de integridad

**Implementación:**
```typescript
class ModuleValidator {
  /**
   * Valida un módulo antes de la conexión
   */
  async validateModule(moduleId: string): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];

    // 1. Check module exists
    checks.push(await this.checkModuleExists(moduleId));

    // 2. Check dependencies
    checks.push(await this.checkDependencies(moduleId));

    // 3. Check conflicts
    checks.push(await this.checkConflicts(moduleId));

    // 4. Check permissions
    checks.push(await this.checkPermissions(moduleId));

    // 5. Check resources
    checks.push(await this.checkResources(moduleId));

    // 6. Check health
    checks.push(await this.checkHealth(moduleId));

    const passed = checks.every(c => c.passed);
    const errors = checks.filter(c => !c.passed).map(c => c.error);
    const warnings = checks.filter(c => c.warning).map(c => c.warning);

    return {
      valid: passed,
      checks,
      errors,
      warnings,
      canProceed: passed && errors.length === 0
    };
  }

  /**
   * Health check de un módulo activo
   */
  async healthCheck(moduleId: string): Promise<HealthStatus> {
    const module = this.loader.getModule(moduleId);

    try {
      const health = await module.health?.();

      return {
        status: health?.status || 'healthy',
        checks: health?.checks || [],
        lastCheck: new Date(),
        uptime: this.calculateUptime(moduleId)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date()
      };
    }
  }

  private async checkModuleExists(moduleId: string): Promise<ValidationCheck> {
    const exists = await this.registry.moduleExists(moduleId);

    return {
      name: 'Module Exists',
      passed: exists,
      error: exists ? undefined : `Module ${moduleId} not found`,
      severity: 'error'
    };
  }

  private async checkDependencies(moduleId: string): Promise<ValidationCheck> {
    const deps = await this.dependencyManager.resolveDependencies(moduleId);

    return {
      name: 'Dependencies',
      passed: deps.canProceed,
      error: deps.conflicts.length > 0
        ? `Dependency conflicts: ${deps.conflicts.map(c => c.moduleId).join(', ')}`
        : undefined,
      warning: deps.toInstall.length > 0
        ? `Will install dependencies: ${deps.toInstall.join(', ')}`
        : undefined,
      severity: 'error'
    };
  }

  private async checkConflicts(moduleId: string): Promise<ValidationCheck> {
    const conflicts = this.dependencyManager.detectConflicts(moduleId);

    return {
      name: 'Conflicts',
      passed: conflicts.length === 0,
      error: conflicts.length > 0
        ? `Conflicts detected: ${conflicts.map(c => c.moduleId).join(', ')}`
        : undefined,
      severity: 'error'
    };
  }

  private async checkPermissions(moduleId: string): Promise<ValidationCheck> {
    const module = await this.registry.getModule(moduleId);
    const user = await this.auth.getCurrentUser();

    const hasPermission = await this.auth.hasPermissions(
      user,
      module.permissions
    );

    return {
      name: 'Permissions',
      passed: hasPermission,
      error: hasPermission ? undefined : 'Insufficient permissions',
      severity: 'error'
    };
  }

  private async checkResources(moduleId: string): Promise<ValidationCheck> {
    const module = await this.registry.getModule(moduleId);
    const resources = await this.system.getAvailableResources();

    const sufficient =
      resources.memory >= (module.config.minMemory || 0) &&
      resources.cpu >= (module.config.minCpu || 0);

    return {
      name: 'Resources',
      passed: sufficient,
      warning: sufficient ? undefined : 'Low system resources',
      severity: 'warning'
    };
  }

  private async checkHealth(moduleId: string): Promise<ValidationCheck> {
    try {
      const health = await this.healthCheck(moduleId);

      return {
        name: 'Health Check',
        passed: health.status === 'healthy',
        error: health.error,
        severity: 'warning'
      };
    } catch (error) {
      return {
        name: 'Health Check',
        passed: true,
        warning: 'Could not perform health check',
        severity: 'info'
      };
    }
  }
}
```

### 5. MODULE MONITOR

**Responsabilidades:**
- Monitorización en tiempo real
- Métricas de uso
- Alertas y notificaciones
- Logs y eventos

**Implementación:**
```typescript
class ModuleMonitor {
  private metrics: Map<string, ModuleMetrics> = new Map();
  private eventBus: EventBus;

  /**
   * Inicia monitorización de un módulo
   */
  startMonitoring(moduleId: string): void {
    const metrics: ModuleMetrics = {
      moduleId,
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      memory: 0,
      cpu: 0,
      activeUsers: 0
    };

    this.metrics.set(moduleId, metrics);

    // Setup monitoring interval
    setInterval(() => {
      this.collectMetrics(moduleId);
    }, 10000); // Every 10 seconds
  }

  /**
   * Detiene monitorización
   */
  stopMonitoring(moduleId: string): void {
    this.metrics.delete(moduleId);
  }

  /**
   * Obtiene métricas actuales
   */
  getMetrics(moduleId: string): ModuleMetrics {
    return this.metrics.get(moduleId) || this.createEmptyMetrics(moduleId);
  }

  /**
   * Obtiene todas las métricas
   */
  getAllMetrics(): Map<string, ModuleMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Registra un evento
   */
  logEvent(moduleId: string, event: ModuleEvent): void {
    this.eventBus.emit('module:event', {
      moduleId,
      event,
      timestamp: Date.now()
    });

    // Update metrics
    const metrics = this.metrics.get(moduleId);
    if (metrics) {
      if (event.type === 'request') {
        metrics.requests++;
      } else if (event.type === 'error') {
        metrics.errors++;
      }
    }
  }

  /**
   * Crea alerta
   */
  createAlert(moduleId: string, alert: Alert): void {
    this.eventBus.emit('module:alert', {
      moduleId,
      alert,
      timestamp: Date.now()
    });

    // Send notifications
    this.notificationService.send({
      type: alert.severity,
      title: `Module Alert: ${moduleId}`,
      message: alert.message,
      moduleId
    });
  }

  private async collectMetrics(moduleId: string): Promise<void> {
    const module = this.loader.getModule(moduleId);
    const metrics = this.metrics.get(moduleId);

    if (!module || !metrics) return;

    // Collect system metrics
    metrics.memory = await this.getModuleMemoryUsage(moduleId);
    metrics.cpu = await this.getModuleCpuUsage(moduleId);
    metrics.activeUsers = await this.getActiveUsers(moduleId);

    // Check thresholds and create alerts
    this.checkThresholds(moduleId, metrics);
  }

  private checkThresholds(moduleId: string, metrics: ModuleMetrics): void {
    // High error rate
    const errorRate = metrics.errors / metrics.requests;
    if (errorRate > 0.1) { // 10%
      this.createAlert(moduleId, {
        severity: 'warning',
        type: 'high-error-rate',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`
      });
    }

    // High memory usage
    if (metrics.memory > 1000) { // 1GB
      this.createAlert(moduleId, {
        severity: 'warning',
        type: 'high-memory',
        message: `High memory usage: ${metrics.memory}MB`
      });
    }

    // High CPU usage
    if (metrics.cpu > 80) { // 80%
      this.createAlert(moduleId, {
        severity: 'warning',
        type: 'high-cpu',
        message: `High CPU usage: ${metrics.cpu}%`
      });
    }
  }
}
```

---

## 🔄 FLUJO DE CONEXIÓN/DESCONEXIÓN

### Flujo de Conexión de Módulo

```
┌─────────────────────────────────────────────────────────────┐
│                  CONEXIÓN DE MÓDULO                          │
└─────────────────────────────────────────────────────────────┘

1. Usuario solicita conexión
   │
   ▼
2. Validación de permisos
   │
   ├─ NO → Error: Permisos insuficientes
   │
   ▼ SÍ
3. Resolución de dependencias
   │
   ├─ Dependencias faltantes → Solicitar instalación
   ├─ Conflictos detectados → Error: Conflictos
   │
   ▼ OK
4. Backup de configuración actual
   │
   ▼
5. Descarga de módulo (si no existe localmente)
   │
   ▼
6. Validación de integridad
   │
   ├─ Checksum inválido → Error: Módulo corrupto
   │
   ▼ OK
7. Instalación de dependencias
   │
   ▼
8. Carga del módulo (lazy load)
   │
   ▼
9. Inicialización del módulo
   │
   ├─ Error → Rollback automático
   │
   ▼ OK
10. Registro en MODULE REGISTRY
    │
    ▼
11. Configuración de rutas
    │
    ▼
12. Actualización de UI
    │
    ▼
13. Inicio de monitorización
    │
    ▼
14. Notificación de éxito
    │
    ▼
15. ✅ Módulo conectado y activo
```

### Flujo de Desconexión de Módulo

```
┌─────────────────────────────────────────────────────────────┐
│                 DESCONEXIÓN DE MÓDULO                        │
└─────────────────────────────────────────────────────────────┘

1. Usuario solicita desconexión
   │
   ▼
2. Validación de permisos
   │
   ├─ NO → Error: Permisos insuficientes
   │
   ▼ SÍ
3. Verificación de dependientes
   │
   ├─ Módulos dependientes activos → Error: No se puede desconectar
   │
   ▼ OK
4. Confirmación de usuario
   │
   ├─ NO → Cancelar
   │
   ▼ SÍ
5. Backup de datos del módulo
   │
   ▼
6. Notificación a usuarios activos
   │
   ▼
7. Cierre de conexiones activas
   │
   ▼
8. Cleanup de recursos
   │
   ▼
9. Descarga del módulo de memoria
   │
   ▼
10. Eliminación de rutas
    │
    ▼
11. Actualización de MODULE REGISTRY
    │
    ▼
12. Actualización de UI
    │
    ▼
13. Detención de monitorización
    │
    ▼
14. Notificación de éxito
    │
    ▼
15. ✅ Módulo desconectado
```

---

## 📊 DASHBOARD VISUAL

### Layout del Dashboard

```
╔═══════════════════════════════════════════════════════════════════╗
║  🔌 MODULE CONNECTOR DASHBOARD                      👤 Admin ▼   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ║
║  │ MÓDULOS ACTIVOS │  │ MÓDULOS TOTALES │  │   USUARIOS      │  ║
║  │                 │  │                 │  │                 │  ║
║  │      24/30      │  │       30        │  │      156        │  ║
║  │                 │  │                 │  │                 │  ║
║  │  📊 80%        │  │  📦 All         │  │  👥 Online      │  ║
║  └─────────────────┘  └─────────────────┘  └─────────────────┘  ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │  ESTADO DE MÓDULOS POR CATEGORÍA                             │ ║
║  │                                                                │ ║
║  │  ████████████████████░░░░░░ Core System (90%)                │ ║
║  │  ████████████████░░░░░░░░░░ Financiero (75%)                 │ ║
║  │  ██████████████████████████ Ventas & CRM (100%)              │ ║
║  │  ████████████░░░░░░░░░░░░░░ Compras (60%)                    │ ║
║  │  ████████████████████░░░░░░ Inventario (85%)                 │ ║
║  │                                                                │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌─────────────────────────────────┐  ┌──────────────────────┐  ║
║  │  MÓDULOS POR ESTADO             │  │  ALERTAS RECIENTES   │  ║
║  │                                  │  │                      │  ║
║  │  🟢 Activos:     24             │  │  ⚠️ High Memory     │  ║
║  │  🟡 En espera:    3             │  │     Marketing       │  ║
║  │  🔴 Error:        0             │  │                      │  ║
║  │  ⚫ Deshabilitados: 3           │  │  ⚠️ Slow Response   │  ║
║  │                                  │  │     Inventory       │  ║
║  │  [Ver detalles]                 │  │                      │  ║
║  └─────────────────────────────────┘  │  [Ver todas]        │  ║
║                                        └──────────────────────┘  ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │  MAPA DE DEPENDENCIAS VISUAL                                 │ ║
║  │                                                                │ ║
║  │              ┌──────────┐                                     │ ║
║  │              │   CORE   │                                     │ ║
║  │              └────┬─────┘                                     │ ║
║  │         ┌────────┼────────┐                                  │ ║
║  │         ▼        ▼        ▼                                  │ ║
║  │    ┌────────┐┌────────┐┌────────┐                           │ ║
║  │    │Financial││  CRM   ││Inventory│                          │ ║
║  │    └────┬────┘└───┬────┘└───┬────┘                          │ ║
║  │         │         │          │                                │ ║
║  │         └────┬────┴────┬────┘                                │ ║
║  │              ▼         ▼                                      │ ║
║  │         ┌────────┐ ┌────────┐                                │ ║
║  │         │Reporting││Analytics│                               │ ║
║  │         └────────┘ └────────┘                                │ ║
║  │                                                                │ ║
║  │  [Ver en modo gráfico] [Exportar]                            │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │  KPIS DE RENDIMIENTO                                         │ ║
║  │                                                                │ ║
║  │  Response Time     Memory Usage     CPU Usage     Uptime     │ ║
║  │     ⚡ 245ms         💾 68%          🖥️ 42%       ✅ 99.9%   │ ║
║  │                                                                │ ║
║  │  [📈 Gráficos detallados]                                    │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

*(Continuará en el siguiente mensaje...)*
