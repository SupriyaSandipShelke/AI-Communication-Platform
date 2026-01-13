import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

/**
 * Prometheus metrics for monitoring
 */

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

export const messageProcessed = new client.Counter({
  name: 'messages_processed_total',
  help: 'Total number of messages processed',
  labelNames: ['platform', 'priority']
});

export const aiOperations = new client.Counter({
  name: 'ai_operations_total',
  help: 'Total number of AI operations',
  labelNames: ['operation', 'status']
});

export const aiOperationDuration = new client.Histogram({
  name: 'ai_operation_duration_seconds',
  help: 'Duration of AI operations in seconds',
  labelNames: ['operation'],
  buckets: [0.5, 1, 2, 5, 10, 30]
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(messageProcessed);
register.registerMetric(aiOperations);
register.registerMetric(aiOperationDuration);

/**
 * Middleware to track HTTP metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.send(metrics);
}
