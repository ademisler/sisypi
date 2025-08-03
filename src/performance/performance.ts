// === PERFORMANCE OPTIMIZATION MODULE ===
// Advanced performance utilities and monitoring for the Sisypi extension

export class PerformanceManager {
  private static instance: PerformanceManager;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private metrics = new Map<string, number[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes default
  private readonly MAX_CACHE_SIZE = 100;

  private constructor() {
    this.startPerformanceMonitoring();
  }

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  // === CACHING SYSTEM ===
  /**
   * Set cache entry with TTL
   */
  public setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    // Clean up expired entries first
    this.cleanExpiredCache();

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache entry if not expired
   */
  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clear specific cache entry
   */
  public clearCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  public clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // === LAZY LOADING ===
  /**
   * Lazy load component with caching
   */
  public async lazyLoad<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    // Check cache first
    const cached = this.getCache<T>(key);
    if (cached) {
      return cached;
    }

    // Load and cache
    const startTime = performance.now();
    try {
      const result = await loader();
      const loadTime = performance.now() - startTime;
      
      this.recordMetric(`lazy_load_${key}`, loadTime);
      this.setCache(key, result, ttl);
      
      return result;
    } catch (error) {
      this.recordMetric(`lazy_load_error_${key}`, performance.now() - startTime);
      throw error;
    }
  }

  // === DEBOUNCING & THROTTLING ===
  private debouncedFunctions = new Map<string, NodeJS.Timeout>();

  /**
   * Enhanced debounce with performance tracking
   */
  public debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existing = this.debouncedFunctions.get(key);
      if (existing) {
        clearTimeout(existing);
      }

      const timeout = setTimeout(() => {
        const startTime = performance.now();
        func(...args);
        this.recordMetric(`debounce_${key}`, performance.now() - startTime);
        this.debouncedFunctions.delete(key);
      }, delay);

      this.debouncedFunctions.set(key, timeout);
    };
  }

  private throttledFunctions = new Map<string, { lastCall: number; timeout?: NodeJS.Timeout }>();

  /**
   * Enhanced throttle with performance tracking
   */
  public throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const throttleData = this.throttledFunctions.get(key);
      const now = Date.now();

      if (!throttleData || now - throttleData.lastCall >= limit) {
        const startTime = performance.now();
        func(...args);
        this.recordMetric(`throttle_${key}`, performance.now() - startTime);
        
        this.throttledFunctions.set(key, { lastCall: now });
      } else if (!throttleData.timeout) {
        const timeout = setTimeout(() => {
          const startTime = performance.now();
          func(...args);
          this.recordMetric(`throttle_delayed_${key}`, performance.now() - startTime);
          
          const data = this.throttledFunctions.get(key);
          if (data) {
            data.lastCall = Date.now();
            delete data.timeout;
          }
        }, limit - (now - throttleData.lastCall));

        throttleData.timeout = timeout;
      }
    };
  }

  // === PERFORMANCE MONITORING ===
  /**
   * Record performance metric
   */
  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get metric statistics
   */
  public getMetricStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    recent: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const recent = values[values.length - 1];

    return { count, avg, min, max, recent };
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Record<string, ReturnType<typeof this.getMetricStats>> {
    const result: Record<string, ReturnType<typeof this.getMetricStats>> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name);
    }
    return result;
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.recordMetric('memory_used', memory.usedJSHeapSize);
          this.recordMetric('memory_total', memory.totalJSHeapSize);
          this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
        }
      }, 30000); // Every 30 seconds
    }

    // Monitor cache performance
    setInterval(() => {
      this.recordMetric('cache_size', this.cache.size);
      this.cleanExpiredCache();
    }, 60000); // Every minute
  }

  // === BATCH OPERATIONS ===
  private batchQueues = new Map<string, {
    items: any[];
    processor: (items: any[]) => Promise<void>;
    timeout: NodeJS.Timeout;
    maxSize: number;
    maxWait: number;
  }>();

  /**
   * Add item to batch queue for processing
   */
  public addToBatch(
    queueName: string,
    item: any,
    processor: (items: any[]) => Promise<void>,
    maxSize: number = 10,
    maxWait: number = 1000
  ): void {
    let queue = this.batchQueues.get(queueName);

    if (!queue) {
      queue = {
        items: [],
        processor,
        timeout: setTimeout(() => this.processBatch(queueName), maxWait),
        maxSize,
        maxWait
      };
      this.batchQueues.set(queueName, queue);
    }

    queue.items.push(item);

    // Process immediately if batch is full
    if (queue.items.length >= maxSize) {
      clearTimeout(queue.timeout);
      this.processBatch(queueName);
    }
  }

  /**
   * Process batch queue
   */
  private async processBatch(queueName: string): Promise<void> {
    const queue = this.batchQueues.get(queueName);
    if (!queue || queue.items.length === 0) {
      return;
    }

    const items = [...queue.items];
    queue.items = [];
    this.batchQueues.delete(queueName);

    const startTime = performance.now();
    try {
      await queue.processor(items);
      this.recordMetric(`batch_${queueName}_success`, performance.now() - startTime);
    } catch (error) {
      this.recordMetric(`batch_${queueName}_error`, performance.now() - startTime);
      console.error(`Batch processing error for ${queueName}:`, error);
    }
  }

  // === RESOURCE OPTIMIZATION ===
  /**
   * Optimize images for better performance
   */
  public optimizeImage(imageUrl: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const optimizedUrl = canvas.toDataURL('image/jpeg', quality);
        
        resolve(optimizedUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Preload critical resources
   */
  public preloadResources(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        if (url.endsWith('.css')) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'style';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to preload CSS: ${url}`));
          document.head.appendChild(link);
        } else if (url.endsWith('.js')) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'script';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to preload JS: ${url}`));
          document.head.appendChild(link);
        } else {
          // Generic resource preload
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to preload resource: ${url}`));
          document.head.appendChild(link);
        }
      });
    });

    return Promise.all(promises);
  }

  // === VIRTUAL SCROLLING ===
  /**
   * Calculate visible items for virtual scrolling
   */
  public calculateVisibleItems(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 5
  ): { startIndex: number; endIndex: number; offsetY: number } {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY };
  }

  // === PERFORMANCE DIAGNOSTICS ===
  /**
   * Run performance diagnostics
   */
  public runDiagnostics(): {
    cacheHealth: any;
    memoryUsage: any;
    metrics: any;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Cache health
    const cacheHealth = {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      utilization: (this.cache.size / this.MAX_CACHE_SIZE) * 100
    };

    if (cacheHealth.utilization > 80) {
      recommendations.push('Cache utilization is high. Consider increasing cache size or reducing TTL.');
    }

    // Memory usage
    const memoryUsage = 'memory' in performance ? {
      used: (performance as any).memory?.usedJSHeapSize || 0,
      total: (performance as any).memory?.totalJSHeapSize || 0,
      limit: (performance as any).memory?.jsHeapSizeLimit || 0
    } : null;

    if (memoryUsage && memoryUsage.used / memoryUsage.limit > 0.8) {
      recommendations.push('Memory usage is high. Consider optimizing data structures or clearing unused references.');
    }

    // Metrics analysis
    const metrics = this.getAllMetrics();
    
    // Check for slow operations
    for (const [name, stats] of Object.entries(metrics)) {
      if (stats && stats.avg > 100) { // Operations taking more than 100ms
        recommendations.push(`Operation '${name}' is slow (avg: ${stats.avg.toFixed(2)}ms). Consider optimization.`);
      }
    }

    return {
      cacheHealth,
      memoryUsage,
      metrics,
      recommendations
    };
  }

  /**
   * Clear all performance data
   */
  public clearAllData(): void {
    this.cache.clear();
    this.metrics.clear();
    this.batchQueues.clear();
    this.debouncedFunctions.clear();
    this.throttledFunctions.clear();
  }
}

// === PERFORMANCE UTILITIES ===
export const performance_manager = PerformanceManager.getInstance();

// === PERFORMANCE DECORATORS ===
export function measurePerformance(metricName: string) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const startTime = performance.now();
      const result = method.apply(this, args);

      if (result instanceof Promise) {
        return result.finally(() => {
          performance_manager.recordMetric(metricName, performance.now() - startTime);
        });
      } else {
        performance_manager.recordMetric(metricName, performance.now() - startTime);
        return result;
      }
    };

    return descriptor;
  };
}

// === PERFORMANCE HOOKS ===
export class PerformanceHooks {
  /**
   * Hook for React component performance monitoring
   */
  static usePerformanceMonitor(componentName: string) {
    const startTime = performance.now();
    
    return {
      recordRender: () => {
        performance_manager.recordMetric(`react_render_${componentName}`, performance.now() - startTime);
      },
      recordUpdate: (reason: string) => {
        performance_manager.recordMetric(`react_update_${componentName}_${reason}`, performance.now() - startTime);
      }
    };
  }

  /**
   * Hook for async operation monitoring
   */
  static async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      performance_manager.recordMetric(`async_${name}_success`, performance.now() - startTime);
      return result;
    } catch (error) {
      performance_manager.recordMetric(`async_${name}_error`, performance.now() - startTime);
      throw error;
    }
  }
}

export default performance_manager;