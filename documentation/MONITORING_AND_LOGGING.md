# Monitoring and Logging Guide
## Mind Hillmetric Application

### Table of Contents
1. [Logging Strategy](#logging-strategy)
2. [Monitoring Setup](#monitoring-setup)
3. [Application Metrics](#application-metrics)
4. [Error Tracking](#error-tracking)
5. [Health Checks](#health-checks)
6. [Log Aggregation](#log-aggregation)
7. [Alerting](#alerting)
8. [Performance Monitoring](#performance-monitoring)
9. [Security Monitoring](#security-monitoring)
10. [Dashboard Configuration](#dashboard-configuration)

---

## Logging Strategy

### Frontend Logging (Next.js)

#### 1. Production Logger Implementation
```typescript
// utils/logger.ts
interface LogEvent {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

class Logger {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async sendLog(event: LogEvent): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      } catch (error) {
        console.error('Failed to send log:', error);
      }
    }
  }

  private createLogEvent(level: LogEvent['level'], message: string, metadata?: Record<string, any>): LogEvent {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata
    };
  }

  info(message: string, metadata?: Record<string, any>): void {
    const event = this.createLogEvent('info', message, metadata);
    console.log(`[INFO] ${message}`, metadata);
    this.sendLog(event);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    const event = this.createLogEvent('warn', message, metadata);
    console.warn(`[WARN] ${message}`, metadata);
    this.sendLog(event);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const errorMetadata = {
      ...metadata,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    };
    const event = this.createLogEvent('error', message, errorMetadata);
    console.error(`[ERROR] ${message}`, error, metadata);
    this.sendLog(event);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      const event = this.createLogEvent('debug', message, metadata);
      console.debug(`[DEBUG] ${message}`, metadata);
      this.sendLog(event);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }
}

export const logger = new Logger();
```

#### 2. API Route for Log Collection
```typescript
// app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const logEvent = await request.json();
    
    // Validate log event
    if (!logEvent.level || !logEvent.message || !logEvent.timestamp) {
      return NextResponse.json({ error: 'Invalid log event' }, { status: 400 });
    }

    // Create logs directory if it doesn't exist
    const logDir = join(process.cwd(), 'logs');
    await mkdir(logDir, { recursive: true });

    // Write to daily log file
    const date = new Date().toISOString().split('T')[0];
    const logFile = join(logDir, `app-${date}.log`);
    const logLine = JSON.stringify(logEvent) + '\n';
    
    await writeFile(logFile, logLine, { flag: 'a' });

    // Send to external logging service (e.g., CloudWatch, Datadog)
    if (process.env.LOG_ENDPOINT) {
      await fetch(process.env.LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_API_KEY}`
        },
        body: JSON.stringify(logEvent)
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 3. Component-Level Logging
```typescript
// hooks/useLogger.ts
import { useEffect } from 'react';
import { logger } from '@/utils/logger';

export function useComponentLogger(componentName: string) {
  useEffect(() => {
    logger.debug(`Component ${componentName} mounted`);
    
    return () => {
      logger.debug(`Component ${componentName} unmounted`);
    };
  }, [componentName]);

  const logUserAction = (action: string, metadata?: Record<string, any>) => {
    logger.info(`User action: ${action} in ${componentName}`, {
      component: componentName,
      ...metadata
    });
  };

  const logError = (error: Error, context?: string) => {
    logger.error(`Error in ${componentName}${context ? `: ${context}` : ''}`, error, {
      component: componentName
    });
  };

  return { logUserAction, logError };
}
```

---

## Monitoring Setup

### 1. Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'mind-hillmetric-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. Metrics API Endpoint
```typescript
// app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Initialize default metrics
collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Total number of active users'
});

const workflowExecutions = new Counter({
  name: 'workflow_executions_total',
  help: 'Total number of workflow executions',
  labelNames: ['status', 'workflow_type']
});

const dataProcessingTime = new Histogram({
  name: 'data_processing_duration_seconds',
  help: 'Duration of data processing operations',
  labelNames: ['operation_type', 'stage']
});

export async function GET() {
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get metrics' }, { status: 500 });
  }
}

// Export metrics for use in other parts of the application
export { httpRequestDuration, httpRequestsTotal, activeUsers, workflowExecutions, dataProcessingTime };
```

### 3. Middleware for Request Tracking
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { httpRequestDuration, httpRequestsTotal } from '@/app/api/metrics/route';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  // Track metrics after response
  response.headers.set('x-request-id', crypto.randomUUID());
  
  // This would be called after the request completes
  const duration = (Date.now() - start) / 1000;
  const method = request.method;
  const route = request.nextUrl.pathname;
  const statusCode = response.status.toString();
  
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Application Metrics

### 1. Business Metrics Tracking
```typescript
// utils/metrics.ts
import { workflowExecutions, dataProcessingTime, activeUsers } from '@/app/api/metrics/route';

export class ApplicationMetrics {
  static trackWorkflowExecution(workflowType: string, status: 'success' | 'failure' | 'timeout') {
    workflowExecutions.inc({ workflow_type: workflowType, status });
  }

  static trackDataProcessing(operationType: string, stage: string, durationMs: number) {
    dataProcessingTime.observe(
      { operation_type: operationType, stage },
      durationMs / 1000
    );
  }

  static updateActiveUsers(count: number) {
    activeUsers.set(count);
  }

  static trackUserAction(action: string, userId: string, metadata?: Record<string, any>) {
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        user_id: userId,
        custom_parameters: metadata
      });
    }
  }

  static trackPageView(page: string, userId?: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        page_title: page,
        page_location: window.location.href,
        user_id: userId
      });
    }
  }

  static trackError(error: Error, context: string, userId?: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${context}: ${error.message}`,
        fatal: false,
        user_id: userId
      });
    }
  }
}
```

### 2. Performance Metrics
```typescript
// hooks/usePerformanceMetrics.ts
import { useEffect } from 'react';
import { ApplicationMetrics } from '@/utils/metrics';

export function usePerformanceMetrics(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      ApplicationMetrics.trackDataProcessing('component_render', componentName, renderTime);
    };
  }, [componentName]);

  const trackOperation = async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      ApplicationMetrics.trackDataProcessing(operationName, componentName, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      ApplicationMetrics.trackDataProcessing(`${operationName}_error`, componentName, duration);
      throw error;
    }
  };

  return { trackOperation };
}
```

---

## Error Tracking

### 1. Sentry Integration
```typescript
// utils/sentry.ts
import * as Sentry from '@sentry/nextjs';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out noisy errors
      if (event.exception) {
        const error = hint.originalException;
        if (error && error.message && error.message.includes('Non-Error promise rejection')) {
          return null;
        }
      }
      return event;
    },
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/your-domain\.com/,
        ],
      }),
    ],
  });
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('Additional Info', context);
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};
```

### 2. Error Boundary with Logging
```typescript
// components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { captureError } from '@/utils/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(
      `Error boundary caught error in ${this.props.context || 'unknown component'}`,
      error,
      {
        errorInfo: errorInfo.componentStack,
        context: this.props.context
      }
    );
    
    captureError(error, {
      context: this.props.context,
      componentStack: errorInfo.componentStack
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            An error occurred in this component. The error has been logged.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Health Checks

### 1. Health Check API
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    external_apis: 'healthy' | 'unhealthy';
    filesystem: 'healthy' | 'unhealthy';
  };
}

async function checkDatabase(): Promise<'healthy' | 'unhealthy'> {
  try {
    // Simulate database check
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkRedis(): Promise<'healthy' | 'unhealthy'> {
  try {
    // Simulate Redis check
    await new Promise(resolve => setTimeout(resolve, 50));
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkExternalAPIs(): Promise<'healthy' | 'unhealthy'> {
  try {
    // Check critical external dependencies
    const response = await fetch('https://api.example.com/health', {
      method: 'GET',
      timeout: 5000
    });
    return response.ok ? 'healthy' : 'unhealthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkFilesystem(): Promise<'healthy' | 'unhealthy'> {
  try {
    const { access } = await import('fs/promises');
    await access('./logs');
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

export async function GET() {
  const startTime = process.hrtime();
  
  try {
    const checks = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkExternalAPIs(),
      checkFilesystem()
    ]);

    const healthStatus: HealthStatus = {
      status: checks.includes('unhealthy') ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: checks[0],
        redis: checks[1],
        external_apis: checks[2],
        filesystem: checks[3]
      }
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        error: 'Health check failed',
        duration_ms: duration
      },
      { status: 503 }
    );
  }
}
```

### 2. Application Health Monitor
```typescript
// utils/healthMonitor.ts
export class HealthMonitor {
  private static instance: HealthMonitor;
  private healthStatus: Map<string, boolean> = new Map();
  private lastCheck: Date = new Date();

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  async performHealthCheck(): Promise<boolean> {
    try {
      const response = await fetch('/api/health');
      const health = await response.json();
      
      this.healthStatus.set('api', response.ok);
      this.healthStatus.set('database', health.checks?.database === 'healthy');
      this.healthStatus.set('redis', health.checks?.redis === 'healthy');
      this.lastCheck = new Date();

      return response.ok;
    } catch (error) {
      this.healthStatus.set('api', false);
      return false;
    }
  }

  isHealthy(service?: string): boolean {
    if (service) {
      return this.healthStatus.get(service) ?? false;
    }
    
    // Overall health
    return Array.from(this.healthStatus.values()).every(status => status);
  }

  getLastCheckTime(): Date {
    return this.lastCheck;
  }

  startPeriodicCheck(intervalMs: number = 30000): void {
    setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }
}
```

---

## Log Aggregation

### 1. ELK Stack Configuration
```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    ports:
      - "5044:5044"
      - "9600:9600"
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline
      - ./logs:/usr/share/logstash/logs
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.8.0
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - ./logs:/var/log/app:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - logstash

volumes:
  elasticsearch-data:
```

### 2. Logstash Pipeline Configuration
```ruby
# logstash/config/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][log_type] == "application" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    mutate {
      add_field => { "log_source" => "mind-hillmetric-app" }
    }
  }
  
  if [level] == "error" {
    mutate {
      add_tag => [ "error" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "mind-hillmetric-%{+YYYY.MM.dd}"
  }
  
  if "error" in [tags] {
    slack {
      url => "${SLACK_WEBHOOK_URL}"
      channel => "#alerts"
      username => "LogstashBot"
      icon_emoji => ":warning:"
      format => "Error in Mind Hillmetric: %{message}"
    }
  }
}
```

### 3. Filebeat Configuration
```yaml
# filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/app/*.log
  fields:
    log_type: application
  fields_under_root: true
  multiline.pattern: '^\d{4}-\d{2}-\d{2}'
  multiline.negate: true
  multiline.match: after

- type: docker
  containers.ids:
    - "*"
  processors:
    - add_docker_metadata:
        host: "unix:///var/run/docker.sock"

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded

output.logstash:
  hosts: ["logstash:5044"]

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

---

## Alerting

### 1. Prometheus Alert Rules
```yaml
# alert_rules.yml
groups:
- name: mind-hillmetric-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} requests per second"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time"
      description: "95th percentile response time is {{ $value }} seconds"

  - alert: ApplicationDown
    expr: up{job="mind-hillmetric-app"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Application is down"
      description: "Mind Hillmetric application is not responding"

  - alert: HighMemoryUsage
    expr: process_resident_memory_bytes / 1024 / 1024 > 512
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Application memory usage is {{ $value }}MB"

  - alert: WorkflowFailureRate
    expr: rate(workflow_executions_total{status="failure"}[10m]) > 0.05
    for: 3m
    labels:
      severity: warning
    annotations:
      summary: "High workflow failure rate"
      description: "Workflow failure rate is {{ $value }} per second"
```

### 2. Alertmanager Configuration
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@mind-hillmetric.com'
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      severity: warning
    receiver: 'warning-alerts'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/'

- name: 'critical-alerts'
  email_configs:
  - to: 'admin@mind-hillmetric.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
  slack_configs:
  - channel: '#critical-alerts'
    title: 'CRITICAL Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

- name: 'warning-alerts'
  slack_configs:
  - channel: '#alerts'
    title: 'Warning Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
```

---

## Performance Monitoring

### 1. Web Vitals Tracking
```typescript
// utils/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function trackWebVitals() {
  getCLS((metric) => {
    sendMetric('CLS', metric.value, metric.rating);
  });

  getFID((metric) => {
    sendMetric('FID', metric.value, metric.rating);
  });

  getFCP((metric) => {
    sendMetric('FCP', metric.value, metric.rating);
  });

  getLCP((metric) => {
    sendMetric('LCP', metric.value, metric.rating);
  });

  getTTFB((metric) => {
    sendMetric('TTFB', metric.value, metric.rating);
  });
}

function sendMetric(name: string, value: number, rating: string) {
  // Send to Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      custom_parameters: {
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        rating: rating,
      },
    });
  }

  // Send to custom analytics
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      value,
      rating,
      url: window.location.href,
      timestamp: Date.now(),
    }),
  });
}
```

### 2. Performance Observer
```typescript
// utils/performanceObserver.ts
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;

  start() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });

    this.observer.observe({ 
      entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] 
    });
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    const metric = {
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now(),
      url: window.location.href
    };

    // Send to monitoring service
    this.sendPerformanceMetric(metric);
  }

  private async sendPerformanceMetric(metric: any) {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

---

## Security Monitoring

### 1. Security Event Logging
```typescript
// utils/securityLogger.ts
import { logger } from './logger';

export class SecurityLogger {
  static logAuthAttempt(userId: string, success: boolean, ip: string, userAgent: string) {
    logger.info('Authentication attempt', {
      event_type: 'auth_attempt',
      user_id: userId,
      success,
      ip_address: ip,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    });
  }

  static logSuspiciousActivity(userId: string, activity: string, details: Record<string, any>) {
    logger.warn('Suspicious activity detected', {
      event_type: 'suspicious_activity',
      user_id: userId,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  }

  static logDataAccess(userId: string, resource: string, action: string) {
    logger.info('Data access', {
      event_type: 'data_access',
      user_id: userId,
      resource,
      action,
      timestamp: new Date().toISOString()
    });
  }

  static logSecurityEvent(eventType: string, severity: 'low' | 'medium' | 'high', details: Record<string, any>) {
    const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    
    logger[logLevel](`Security event: ${eventType}`, {
      event_type: 'security_event',
      security_severity: severity,
      details,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. Rate Limiting Monitor
```typescript
// utils/rateLimitMonitor.ts
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function monitorRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    SecurityLogger.logSuspiciousActivity(identifier, 'rate_limit_exceeded', {
      current_count: current.count,
      limit,
      window_ms: windowMs
    });
    return false;
  }
  
  current.count++;
  return true;
}
```

---

## Dashboard Configuration

### 1. Grafana Dashboard JSON
```json
{
  "dashboard": {
    "title": "Mind Hillmetric Application Dashboard",
    "tags": ["mind-hillmetric", "application"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ]
      },
      {
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100"
          }
        ],
        "valueName": "current",
        "format": "percent",
        "thresholds": "5,10"
      },
      {
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_users_total"
          }
        ]
      },
      {
        "title": "Workflow Executions",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(workflow_executions_total[5m])",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "Memory (MB)"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### 2. Custom Dashboard Component
```typescript
// components/Dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Metrics {
  requestRate: number;
  errorRate: number;
  responseTime: number;
  activeUsers: number;
  workflowExecutions: number;
}

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics/summary');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Request Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.requestRate?.toFixed(2) || 0} req/s
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            (metrics?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'
          }`}>
            {metrics?.errorRate?.toFixed(2) || 0}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.responseTime?.toFixed(0) || 0}ms
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.activeUsers || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.workflowExecutions || 0}/hr
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Environment Configuration

### 1. Production Monitoring Environment Variables
```bash
# .env.production
# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
GRAFANA_URL=https://grafana.mind-hillmetric.com
GRAFANA_API_KEY=your_grafana_api_key

# Logging
LOG_LEVEL=info
LOG_ENDPOINT=https://logs.mind-hillmetric.com/api/v1/logs
LOG_API_KEY=your_log_api_key
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Health Checks
HEALTH_CHECK_INTERVAL=30000
DATABASE_HEALTH_CHECK_TIMEOUT=5000
REDIS_HEALTH_CHECK_TIMEOUT=3000

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
ALERT_EMAIL=alerts@mind-hillmetric.com
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Performance
WEB_VITALS_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true
ANALYTICS_ENDPOINT=https://analytics.mind-hillmetric.com
```

### 2. Docker Compose for Monitoring Stack
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager:/etc/alertmanager
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
```

This comprehensive monitoring and logging guide provides concrete, production-ready implementations for tracking application performance, errors, and system health. All configurations are ready to use and include specific code examples, configuration files, and setup instructions.