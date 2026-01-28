/**
 * AIT-CORE Module Connector - Type Definitions
 *
 * @module @ait-core/module-connector
 * @description Sistema de conexión/desconexión dinámica de módulos
 * @author AIT - AI Innovation Technologies
 * @version 2.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ModuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOADING = 'loading',
  ERROR = 'error',
  DISABLED = 'disabled',
  PENDING = 'pending'
}

export enum ModuleCategory {
  CORE = 'core',
  FINANCIAL = 'financial',
  SALES_CRM = 'sales-crm',
  PURCHASING = 'purchasing',
  INVENTORY = 'inventory',
  PRODUCTION = 'production',
  HR = 'hr',
  PROJECTS = 'projects',
  MARKETING = 'marketing',
  CUSTOMER_SERVICE = 'customer-service',
  LOGISTICS = 'logistics',
  QUALITY = 'quality',
  LEGAL = 'legal',
  BI = 'bi',
  ECOMMERCE = 'ecommerce',
  POS = 'pos',
  ASSETS = 'assets',
  MAINTENANCE = 'maintenance',
  REAL_ESTATE = 'real-estate',
  INSURANCE = 'insurance',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  HOSPITALITY = 'hospitality',
  AGRICULTURE = 'agriculture',
  CONSTRUCTION = 'construction',
  ENERGY = 'energy',
  TELECOM = 'telecom',
  GAMING = 'gaming',
  FLEET = 'fleet',
  INTEGRATIONS = 'integrations'
}

export enum DependencyType {
  HARD = 'hard',        // Must be installed
  SOFT = 'soft',        // Optional but recommended
  PEER = 'peer',        // Must be same version
  DEV = 'dev'           // Development only
}

export enum LicenseType {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

export enum ModuleEventType {
  LOADING = 'loading',
  LOADED = 'loaded',
  UNLOADING = 'unloading',
  UNLOADED = 'unloaded',
  ERROR = 'error',
  UPDATED = 'updated',
  REQUEST = 'request',
  RESPONSE = 'response'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

// ============================================================================
// MODULE DEFINITIONS
// ============================================================================

export interface ModuleDefinition {
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
  status: ModuleStatus;
  installedAt?: Date;
  lastUpdated?: Date;
  lastAccessed?: Date;

  // Dependencias
  dependencies: ModuleDependency[];
  conflicts: string[];
  requiredBy: string[];

  // Configuración
  config: ModuleConfig;
  settings: Record<string, any>;

  // Submódulos y herramientas
  submodules: SubmoduleDefinition[];
  tools: ToolDefinition[];

  // Licencia y permisos
  license: LicenseType;
  permissions: Permission[];
  roles: string[];

  // Marketplace
  author: string;
  authorEmail?: string;
  authorUrl?: string;
  rating: number;
  downloads: number;
  price?: number;
  currency?: string;

  // URLs y recursos
  repository?: string;
  homepage?: string;
  documentation?: string;
  changelog?: string;

  // Metadata adicional
  keywords: string[];
  screenshots?: string[];
  video?: string;
}

export interface ModuleDependency {
  moduleId: string;
  version: string;
  required: boolean;
  type: DependencyType;
  reason?: string;
}

export interface ModuleConfig {
  // Recursos
  minMemory?: number;       // MB
  maxMemory?: number;       // MB
  minCpu?: number;          // %

  // Carga
  lazyLoad?: boolean;
  preload?: boolean;
  priority?: number;        // 0-100

  // Caché
  cacheable?: boolean;
  cacheTimeout?: number;    // seconds

  // Timeouts
  loadTimeout?: number;     // ms
  requestTimeout?: number;  // ms

  // Features
  hotReload?: boolean;
  autoUpdate?: boolean;
  telemetry?: boolean;

  // Custom settings
  [key: string]: any;
}

export interface SubmoduleDefinition {
  id: string;
  name: string;
  displayName: string;
  parentId: string;
  status: ModuleStatus;
  icon?: string;
  description?: string;
  config: Partial<ModuleConfig>;
  tools: ToolDefinition[];
  permissions: Permission[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  displayName: string;
  type: 'dashboard' | 'report' | 'analyzer' | 'calculator' | 'integration' | 'widget' | 'utility';
  icon: string;
  enabled: boolean;
  description?: string;
  permissions: Permission[];
  config?: Record<string, any>;
}

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute' | 'admin';
  conditions?: Record<string, any>;
}

// ============================================================================
// MODULE LIFECYCLE
// ============================================================================

export interface Module {
  definition: ModuleDefinition;

  // Lifecycle hooks
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
  health?(): Promise<HealthCheckResult>;

  // Module API
  loadSubmodule?(submoduleId: string): Promise<Submodule>;
  getRoutes?(): Route[];
  getComponents?(): Component[];

  // Dependencies
  dependencies?: string[];

  // Custom methods
  [key: string]: any;
}

export interface Submodule {
  definition: SubmoduleDefinition;
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
  [key: string]: any;
}

export interface Route {
  path: string;
  component: string;
  exact?: boolean;
  guards?: string[];
  meta?: Record<string, any>;
}

export interface Component {
  name: string;
  component: any;
  props?: Record<string, any>;
}

// ============================================================================
// DEPENDENCY MANAGEMENT
// ============================================================================

export interface ResolvedDependencies {
  resolved: string[];
  toInstall: string[];
  conflicts: Conflict[];
  canProceed: boolean;
}

export interface Conflict {
  moduleId: string;
  required?: string;
  installed?: string;
  type: 'version-mismatch' | 'incompatible' | 'circular' | 'missing';
  message?: string;
}

export interface DependencyTree {
  root: DependencyNode;
  totalDependencies: number;
}

export interface DependencyNode {
  id: string;
  name?: string;
  version?: string;
  depth: number;
  circular?: boolean;
  children?: DependencyNode[];
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  error?: string;
  warning?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface HealthCheckResult {
  status: HealthStatus;
  checks?: HealthCheck[];
  error?: string;
  lastCheck?: Date;
  uptime?: number;
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message?: string;
  duration?: number;
}

// ============================================================================
// MONITORING
// ============================================================================

export interface ModuleMetrics {
  moduleId: string;
  startTime: number;

  // Performance
  requests: number;
  errors: number;
  avgResponseTime: number;
  p95ResponseTime?: number;
  p99ResponseTime?: number;

  // Resources
  memory: number;           // MB
  cpu: number;              // %
  disk?: number;            // MB

  // Usage
  activeUsers: number;
  totalUsers?: number;
  sessions?: number;

  // Availability
  uptime?: number;          // seconds
  downtime?: number;        // seconds
  availability?: number;    // %

  // Custom metrics
  [key: string]: any;
}

export interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  timestamp: number;
  data?: any;
  userId?: string;
  error?: Error;
}

export interface Alert {
  severity: AlertSeverity;
  type: string;
  message: string;
  moduleId?: string;
  timestamp?: number;
  acknowledged?: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// REGISTRY
// ============================================================================

export interface ModuleRegistry {
  modules: Map<string, ModuleDefinition>;
  getModule(id: string): ModuleDefinition | undefined;
  getAllModules(): ModuleDefinition[];
  getModulesByCategory(category: ModuleCategory): ModuleDefinition[];
  getModulesByStatus(status: ModuleStatus): ModuleDefinition[];
  registerModule(module: ModuleDefinition): void;
  unregisterModule(id: string): void;
  updateModule(id: string, updates: Partial<ModuleDefinition>): void;
  moduleExists(id: string): boolean;
}

// ============================================================================
// LOADER
// ============================================================================

export interface LoaderOptions {
  timeout?: number;
  retry?: number;
  cache?: boolean;
  preload?: string[];
}

export interface LoadResult {
  module: Module;
  loadTime: number;
  fromCache: boolean;
}

export interface UnloadResult {
  success: boolean;
  cleanupTime?: number;
  error?: Error;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface ModuleConnectorEvents {
  'module:loading': (data: { moduleId: string }) => void;
  'module:loaded': (data: { moduleId: string; module: Module }) => void;
  'module:unloading': (data: { moduleId: string }) => void;
  'module:unloaded': (data: { moduleId: string }) => void;
  'module:error': (data: { moduleId: string; error: Error }) => void;
  'module:updated': (data: { moduleId: string; updates: Partial<ModuleDefinition> }) => void;
  'module:event': (data: ModuleEvent) => void;
  'module:alert': (data: { moduleId: string; alert: Alert; timestamp: number }) => void;
  'dependency:resolved': (data: { moduleId: string; dependencies: ResolvedDependencies }) => void;
  'dependency:conflict': (data: { moduleId: string; conflicts: Conflict[] }) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ModuleConnectorConfig {
  // Paths
  modulesPath: string;
  cachePath?: string;

  // Behavior
  autoLoad?: boolean;
  hotReload?: boolean;
  validateOnLoad?: boolean;

  // Limits
  maxModules?: number;
  maxMemoryPerModule?: number;

  // Timeouts
  loadTimeout?: number;
  healthCheckInterval?: number;

  // Features
  telemetry?: boolean;
  marketplace?: boolean;
  autoUpdate?: boolean;

  // Custom
  [key: string]: any;
}

// ============================================================================
// UI/DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalModules: number;
  activeModules: number;
  inactiveModules: number;
  errorModules: number;
  totalUsers: number;
  activeUsers: number;
  systemHealth: HealthStatus;
  uptime: number;
}

export interface ModuleCardData extends ModuleDefinition {
  metrics?: ModuleMetrics;
  health?: HealthCheckResult;
  alerts?: Alert[];
}

export interface FlowNode {
  id: string;
  type: 'module' | 'submodule' | 'tool';
  data: {
    label: string;
    icon?: string;
    status: ModuleStatus;
    category?: ModuleCategory;
  };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'dependency' | 'conflict' | 'relation';
  animated?: boolean;
  label?: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId: string;
    duration: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// FILTERS AND QUERIES
// ============================================================================

export interface ModuleFilter {
  status?: ModuleStatus | ModuleStatus[];
  category?: ModuleCategory | ModuleCategory[];
  search?: string;
  tags?: string[];
  license?: LicenseType | LicenseType[];
  rating?: number;
}

export interface ModuleSort {
  field: 'name' | 'rating' | 'downloads' | 'lastUpdated' | 'category';
  order: 'asc' | 'desc';
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export interface MarketplaceModule extends ModuleDefinition {
  featured: boolean;
  verified: boolean;
  reviews: Review[];
  supportedVersions: string[];
  minimumCoreVersion: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface InstallOptions {
  version?: string;
  skipDependencies?: boolean;
  force?: boolean;
  backup?: boolean;
}
