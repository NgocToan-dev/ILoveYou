import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class PerformanceService {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
    
    if (this.isEnabled) {
      this.initializeWebVitals();
      this.setupPerformanceObserver();
    }
  }

  // Initialize Web Vitals monitoring
  initializeWebVitals() {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));
  }

  // Handle web vitals metrics
  handleMetric(metric) {
    this.metrics.set(metric.name, metric);
    
    console.log(`${metric.name}: ${metric.value}`);
    
    // Send to analytics service
    this.sendToAnalytics({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: this.getRating(metric.name, metric.value)
    });

    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameter_1: metric.id
      });
    }
  }

  // Setup Performance Observer for additional metrics
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleNavigationEntry(entry);
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Navigation timing not supported');
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleResourceEntry(entry);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('Resource timing not supported');
      }

      // Observe long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleLongTask(entry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task timing not supported');
      }
    }
  }

  // Handle navigation timing entries
  handleNavigationEntry(entry) {
    const metrics = {
      dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcp_connect: entry.connectEnd - entry.connectStart,
      ssl_negotiate: entry.connectEnd - entry.secureConnectionStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      dom_interactive: entry.domInteractive - entry.navigationStart,
      dom_complete: entry.domComplete - entry.navigationStart,
      load_complete: entry.loadEventEnd - entry.navigationStart
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.sendToAnalytics({
          name: `navigation_${name}`,
          value: Math.round(value),
          type: 'navigation'
        });
      }
    });
  }

  // Handle resource timing entries
  handleResourceEntry(entry) {
    // Track slow resources
    const duration = entry.responseEnd - entry.requestStart;
    
    if (duration > 1000) { // Resources taking more than 1 second
      this.sendToAnalytics({
        name: 'slow_resource',
        value: Math.round(duration),
        type: 'resource',
        url: entry.name,
        resource_type: this.getResourceType(entry.name)
      });
    }
  }

  // Handle long tasks
  handleLongTask(entry) {
    // Tasks longer than 50ms
    if (entry.duration > 50) {
      this.sendToAnalytics({
        name: 'long_task',
        value: Math.round(entry.duration),
        type: 'longtask',
        start_time: Math.round(entry.startTime)
      });
    }
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.includes('font')) return 'font';
    return 'other';
  }

  // Get performance rating
  getRating(metricName, value) {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Send metrics to analytics service
  sendToAnalytics(data) {
    if (!this.analyticsEndpoint) return;

    // Batch metrics to avoid too many requests
    if (!this.metricsQueue) {
      this.metricsQueue = [];
    }

    this.metricsQueue.push({
      ...data,
      timestamp: Date.now(),
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      connection: this.getConnectionInfo()
    });

    // Send in batches every 5 seconds
    if (!this.sendTimer) {
      this.sendTimer = setTimeout(() => {
        this.flushMetrics();
      }, 5000);
    }
  }

  // Flush metrics queue
  flushMetrics() {
    if (this.metricsQueue.length === 0) return;

    fetch(this.analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metrics: this.metricsQueue,
        session_id: this.getSessionId()
      })
    }).catch(error => {
      console.warn('Failed to send metrics:', error);
    });

    this.metricsQueue = [];
    this.sendTimer = null;
  }

  // Get connection information
  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effective_type: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        save_data: conn.saveData
      };
    }
    return null;
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  // Measure custom timing
  measureTiming(name, startTime) {
    const duration = performance.now() - startTime;
    
    this.sendToAnalytics({
      name: `custom_${name}`,
      value: Math.round(duration),
      type: 'custom'
    });

    return duration;
  }

  // Start measuring custom performance
  startMeasure(name) {
    const startTime = performance.now();
    return {
      end: () => this.measureTiming(name, startTime)
    };
  }

  // Mark feature usage
  markFeatureUsage(feature, metadata = {}) {
    this.sendToAnalytics({
      name: 'feature_usage',
      feature,
      type: 'usage',
      ...metadata
    });
  }

  // Get current metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Get performance report
  getPerformanceReport() {
    const report = {
      web_vitals: this.getMetrics(),
      memory: this.getMemoryInfo(),
      timing: this.getTimingInfo(),
      connection: this.getConnectionInfo()
    };

    return report;
  }

  // Get memory information
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Get timing information
  getTimingInfo() {
    const timing = performance.timing;
    return {
      navigation_start: timing.navigationStart,
      dom_content_loaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      load_complete: timing.loadEventEnd - timing.navigationStart,
      first_paint: this.getFirstPaint()
    };
  }

  // Get first paint timing
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }
}

// Create singleton instance
const performanceService = new PerformanceService();

export default performanceService;

// Utility functions for components
export const measureComponentRender = (componentName) => {
  return performanceService.startMeasure(`component_render_${componentName}`);
};

export const markInteraction = (action, metadata) => {
  performanceService.markFeatureUsage(action, metadata);
};

export const getPerformanceReport = () => {
  return performanceService.getPerformanceReport();
};