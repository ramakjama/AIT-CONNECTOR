/**
 * AIT-CONNECTOR Basic Usage Examples
 *
 * @description Complete examples showing how to use the Module Connector
 */

import {
  ModuleConnector,
  ModuleLoader,
  DependencyManager,
  ModuleRegistry,
  ModuleDefinition,
  ModuleCategory,
  ModuleStatus,
  LicenseType
} from '@ait-core/module-connector';

// ============================================================================
// EXAMPLE 1: Basic Module Loading
// ============================================================================

async function basicModuleLoading() {
  console.log('=== Example 1: Basic Module Loading ===\n');

  // Create module loader
  const loader = new ModuleLoader({
    timeout: 30000,
    retry: 3,
    cache: true
  });

  try {
    // Load a module
    const result = await loader.loadModule('financial-module');

    console.log('Module loaded successfully!');
    console.log('- Load time:', result.loadTime, 'ms');
    console.log('- From cache:', result.fromCache);
    console.log('- Module:', result.module.definition.displayName);

    // Use the module
    const module = result.module;
    if (module.initialize) {
      await module.initialize();
    }

    // Unload when done
    await loader.unloadModule('financial-module');

    console.log('\n✅ Module unloaded successfully\n');

  } catch (error) {
    console.error('Error loading module:', error);
  }
}

// ============================================================================
// EXAMPLE 2: Batch Module Loading
// ============================================================================

async function batchModuleLoading() {
  console.log('=== Example 2: Batch Module Loading ===\n');

  const loader = new ModuleLoader();

  try {
    // Load multiple modules in parallel
    const moduleIds = [
      'financial-module',
      'crm-module',
      'inventory-module'
    ];

    console.log('Loading modules:', moduleIds.join(', '));

    const results = await loader.loadModules(moduleIds);

    console.log(`\n✅ Loaded ${results.size} modules successfully`);

    results.forEach((result, id) => {
      console.log(`- ${id}: ${result.loadTime}ms`);
    });

    // Get metrics
    const metrics = loader.getMetrics();
    console.log('\nMetrics:');
    console.log('- Total loads:', metrics.totalLoads);
    console.log('- Cache hit rate:', (metrics.cacheHitRate * 100).toFixed(2) + '%');

  } catch (error) {
    console.error('Error in batch loading:', error);
  }
}

// ============================================================================
// EXAMPLE 3: Dependency Resolution
// ============================================================================

async function dependencyResolution() {
  console.log('=== Example 3: Dependency Resolution ===\n');

  const registry = new ModuleRegistry();

  // Register some modules
  const coreModule: ModuleDefinition = {
    id: 'core',
    name: 'Core Module',
    version: '1.0.0',
    category: ModuleCategory.CORE,
    displayName: 'Core System',
    description: 'Core system module',
    icon: '🎯',
    color: '#1976d2',
    tags: ['core', 'essential'],
    status: ModuleStatus.ACTIVE,
    dependencies: [],
    conflicts: [],
    requiredBy: [],
    config: {},
    settings: {},
    submodules: [],
    tools: [],
    license: LicenseType.FREE,
    permissions: [],
    roles: [],
    author: 'AIT',
    rating: 5,
    downloads: 1000,
    keywords: ['core']
  };

  const financialModule: ModuleDefinition = {
    ...coreModule,
    id: 'financial',
    name: 'Financial Module',
    displayName: 'Financial Management',
    category: ModuleCategory.FINANCIAL,
    dependencies: [
      {
        moduleId: 'core',
        version: '^1.0.0',
        required: true,
        type: 'hard' as any
      }
    ]
  };

  registry.registerModule(coreModule);
  registry.registerModule(financialModule);

  // Create dependency manager
  const depManager = new DependencyManager(
    registry.getAllModules().reduce((map, mod) => {
      map.set(mod.id, mod);
      return map;
    }, new Map())
  );

  try {
    // Resolve dependencies
    const resolved = await depManager.resolveDependencies('financial');

    console.log('Dependency Resolution Results:');
    console.log('- Resolved:', resolved.resolved);
    console.log('- To Install:', resolved.toInstall);
    console.log('- Conflicts:', resolved.conflicts.length);
    console.log('- Can Proceed:', resolved.canProceed ? '✅' : '❌');

    // Build dependency tree
    const tree = depManager.buildDependencyTree('financial');

    console.log('\nDependency Tree:');
    console.log(JSON.stringify(tree, null, 2));

  } catch (error) {
    console.error('Error resolving dependencies:', error);
  }
}

// ============================================================================
// EXAMPLE 4: Hot Reload
// ============================================================================

async function hotReload() {
  console.log('=== Example 4: Hot Module Reload ===\n');

  const loader = new ModuleLoader({ cache: true });

  try {
    // Initial load
    console.log('Loading module...');
    await loader.loadModule('test-module');

    console.log('✅ Module loaded');

    // Simulate code change - hot reload
    console.log('\n🔄 Code changed, reloading module...');

    const reloadResult = await loader.reloadModule('test-module');

    console.log('✅ Module reloaded successfully');
    console.log('- Load time:', reloadResult.loadTime, 'ms');
    console.log('- From cache:', reloadResult.fromCache);

  } catch (error) {
    console.error('Error in hot reload:', error);
  }
}

// ============================================================================
// EXAMPLE 5: Module Connector Full Integration
// ============================================================================

async function fullIntegration() {
  console.log('=== Example 5: Full Integration ===\n');

  // Initialize the complete Module Connector system
  const connector = new ModuleConnector({
    modulesPath: './modules',
    autoLoad: true,
    hotReload: true,
    validateOnLoad: true,
    telemetry: true
  });

  // Listen to events
  connector.on('module:loaded', ({ moduleId, module }) => {
    console.log(`📦 Module loaded: ${moduleId}`);
  });

  connector.on('module:error', ({ moduleId, error }) => {
    console.error(`❌ Module error: ${moduleId}`, error);
  });

  connector.on('dependency:resolved', ({ moduleId, dependencies }) => {
    console.log(`🔗 Dependencies resolved for: ${moduleId}`);
  });

  try {
    // Connect a module (full workflow)
    console.log('Connecting Financial Module...\n');

    await connector.connect('financial-module');

    console.log('\n✅ Module connected successfully!');

    // Get module statistics
    const stats = connector.getStatistics();

    console.log('\nSystem Statistics:');
    console.log('- Total Modules:', stats.totalModules);
    console.log('- Active Modules:', stats.activeModules);
    console.log('- Load Success Rate:', (stats.successRate * 100).toFixed(2) + '%');

    // Disconnect module
    console.log('\n🔌 Disconnecting module...');

    await connector.disconnect('financial-module');

    console.log('✅ Module disconnected successfully');

  } catch (error) {
    console.error('Error in full integration:', error);
  } finally {
    await connector.cleanup();
  }
}

// ============================================================================
// EXAMPLE 6: Advanced Features
// ============================================================================

async function advancedFeatures() {
  console.log('=== Example 6: Advanced Features ===\n');

  const loader = new ModuleLoader();

  try {
    // Prefetching - load in background
    console.log('Prefetching modules...');
    loader.prefetch('reports-module');
    loader.prefetch('analytics-module');

    // Preload critical modules
    console.log('\nPreloading critical modules...');
    await loader.preloadCritical(['core', 'auth', 'database']);

    console.log('✅ Critical modules preloaded');

    // Load with batch optimization
    console.log('\nLoading batch with priority...');
    const batchResults = await loader.loadBatch(
      ['module-1', 'module-2', 'module-3'],
      { parallel: false, priority: true }
    );

    console.log(`✅ Loaded ${batchResults.size} modules in priority order`);

    // Cache optimization
    console.log('\nOptimizing cache...');
    await loader.optimizeCache();

    console.log('✅ Cache optimized');

    // Get comprehensive metrics
    const metrics = loader.getMetrics();

    console.log('\nComprehensive Metrics:');
    console.log(JSON.stringify(metrics, null, 2));

  } catch (error) {
    console.error('Error in advanced features:', error);
  }
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

async function runAllExamples() {
  console.log('\n🚀 AIT-CONNECTOR Usage Examples\n');
  console.log('='.repeat(60) + '\n');

  try {
    await basicModuleLoading();
    await batchModuleLoading();
    await dependencyResolution();
    await hotReload();
    await fullIntegration();
    await advancedFeatures();

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All examples completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

// Export for use in other files
export {
  basicModuleLoading,
  batchModuleLoading,
  dependencyResolution,
  hotReload,
  fullIntegration,
  advancedFeatures,
  runAllExamples
};
