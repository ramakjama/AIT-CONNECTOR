/**
 * Module Loader Tests
 *
 * @module @ait-core/module-connector
 * @description Test suite completo para ModuleLoader
 */

import { ModuleLoader } from './ModuleLoader';
import { Module, ModuleDefinition, ModuleStatus, ModuleCategory } from '../types';

// Mock module
class MockModule implements Module {
  definition: ModuleDefinition = {
    id: 'test-module',
    name: 'Test Module',
    version: '1.0.0',
    category: ModuleCategory.CORE,
    displayName: 'Test Module',
    description: 'A test module',
    icon: '📦',
    color: '#1976d2',
    tags: [],
    status: ModuleStatus.INACTIVE,
    dependencies: [],
    conflicts: [],
    requiredBy: [],
    config: {},
    settings: {},
    submodules: [],
    tools: [],
    license: 'free' as any,
    permissions: [],
    roles: [],
    author: 'Test',
    rating: 5,
    downloads: 100,
    keywords: []
  };

  initialized = false;
  cleaned = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async cleanup(): Promise<void> {
    this.cleaned = true;
  }

  async health() {
    return {
      status: 'healthy' as any,
      checks: []
    };
  }
}

describe('ModuleLoader', () => {
  let loader: ModuleLoader;

  beforeEach(() => {
    loader = new ModuleLoader({
      timeout: 5000,
      retry: 2,
      cache: true,
      preload: []
    });
  });

  afterEach(async () => {
    await loader.cleanup();
  });

  describe('loadModule', () => {
    it('should load a module successfully', async () => {
      const moduleId = 'test-module';

      // Mock the import
      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      const result = await loader.loadModule(moduleId);

      expect(result).toBeDefined();
      expect(result.module).toBeInstanceOf(MockModule);
      expect(result.fromCache).toBe(false);
      expect(result.loadTime).toBeGreaterThan(0);
    });

    it('should return cached module on second load', async () => {
      const moduleId = 'test-module';

      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      // First load
      const result1 = await loader.loadModule(moduleId);
      expect(result1.fromCache).toBe(false);

      // Second load (from cache)
      const result2 = await loader.loadModule(moduleId);
      expect(result2.fromCache).toBe(true);
    });

    it('should initialize module on load', async () => {
      const moduleId = 'test-module';
      const mockModule = new MockModule();

      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(mockModule);

      await loader.loadModule(moduleId);

      expect(mockModule.initialized).toBe(true);
    });

    it('should handle load timeout', async () => {
      const moduleId = 'test-module';

      jest.spyOn(loader as any, 'performLoad').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      await expect(loader.loadModule(moduleId)).rejects.toThrow('Operation timeout');
    });

    it('should retry on failure', async () => {
      const moduleId = 'test-module';
      let attempts = 0;

      jest.spyOn(loader as any, 'performLoad').mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Load failed'));
        }
        return Promise.resolve(new MockModule());
      });

      const result = await loader.loadModule(moduleId);

      expect(attempts).toBe(3);
      expect(result.module).toBeInstanceOf(MockModule);
    });
  });

  describe('unloadModule', () => {
    it('should unload a module successfully', async () => {
      const moduleId = 'test-module';
      const mockModule = new MockModule();

      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(mockModule);

      await loader.loadModule(moduleId);

      const result = await loader.unloadModule(moduleId);

      expect(result.success).toBe(true);
      expect(mockModule.cleaned).toBe(true);
    });

    it('should return success if module not loaded', async () => {
      const result = await loader.unloadModule('non-existent');

      expect(result.success).toBe(true);
      expect(result.cleanupTime).toBe(0);
    });
  });

  describe('reloadModule', () => {
    it('should reload a module', async () => {
      const moduleId = 'test-module';

      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      // Load initially
      await loader.loadModule(moduleId);

      // Reload
      const result = await loader.reloadModule(moduleId);

      expect(result.module).toBeInstanceOf(MockModule);
      expect(result.fromCache).toBe(false);
    });
  });

  describe('loadModules (batch)', () => {
    it('should load multiple modules in parallel', async () => {
      const moduleIds = ['module-1', 'module-2', 'module-3'];

      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      const results = await loader.loadModules(moduleIds);

      expect(results.size).toBe(3);
      moduleIds.forEach(id => {
        expect(results.has(id)).toBe(true);
      });
    });
  });

  describe('cache management', () => {
    it('should clear cache for specific module', async () => {
      const moduleId = 'test-module';

      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      await loader.loadModule(moduleId);
      expect(loader.isLoaded(moduleId)).toBe(true);

      loader.clearCache(moduleId);

      expect(loader.isLoaded(moduleId)).toBe(false);
    });

    it('should clear all cache', async () => {
      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      await loader.loadModules(['module-1', 'module-2']);

      loader.clearCache();

      expect(loader.isLoaded('module-1')).toBe(false);
      expect(loader.isLoaded('module-2')).toBe(false);
    });

    it('should prune old cache entries', async () => {
      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      await loader.loadModule('test-module');

      // Mock old timestamp
      const cache = (loader as any).loadedModules.get('test-module');
      if (cache) {
        cache.timestamp = Date.now() - 7200000; // 2 hours ago
      }

      loader.pruneCache(3600000); // 1 hour max age

      expect(loader.isLoaded('test-module')).toBe(false);
    });
  });

  describe('metrics', () => {
    it('should track load metrics', async () => {
      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      await loader.loadModule('module-1');
      await loader.loadModule('module-2');
      await loader.loadModule('module-1'); // From cache

      const metrics = loader.getMetrics();

      expect(metrics.totalLoads).toBe(2);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(2);
      expect(metrics.cacheHitRate).toBe(0.5);
    });
  });

  describe('preloading', () => {
    it('should preload modules', async () => {
      const moduleIds = ['module-1', 'module-2'];

      jest.spyOn(loader as any, 'performLoad').mockResolvedValue(new MockModule());

      await loader.preloadModules(moduleIds);

      expect(loader.isLoaded('module-1')).toBe(true);
      expect(loader.isLoaded('module-2')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should emit error event on load failure', async () => {
      const moduleId = 'test-module';
      const errorHandler = jest.fn();

      loader.on('module:load-error', errorHandler);

      jest.spyOn(loader as any, 'performLoad').mockRejectedValue(new Error('Load failed'));

      await expect(loader.loadModule(moduleId)).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });
  });
});

describe('ModuleLoader Integration Tests', () => {
  it('should handle complete lifecycle', async () => {
    const loader = new ModuleLoader();
    const moduleId = 'integration-test';
    const mockModule = new MockModule();

    jest.spyOn(loader as any, 'performLoad').mockResolvedValue(mockModule);

    // Load
    const loadResult = await loader.loadModule(moduleId);
    expect(loadResult.module).toBe(mockModule);
    expect(mockModule.initialized).toBe(true);

    // Verify loaded
    expect(loader.isLoaded(moduleId)).toBe(true);

    // Reload
    const reloadResult = await loader.reloadModule(moduleId);
    expect(reloadResult.module).toBeInstanceOf(MockModule);

    // Unload
    const unloadResult = await loader.unloadModule(moduleId);
    expect(unloadResult.success).toBe(true);
    expect(loader.isLoaded(moduleId)).toBe(false);

    // Cleanup
    await loader.cleanup();
  });
});
