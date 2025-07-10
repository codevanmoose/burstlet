import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from './service';
import { performance } from 'perf_hooks';

export class MonitoringMiddleware {
  constructor(private monitoringService: MonitoringService) {}

  /**
   * Request monitoring middleware
   */
  requestMonitoring() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const originalSend = res.send;
      const originalJson = res.json;

      // Add request ID if not present
      const requestId = (req as any).security?.requestId || 
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      (req as any).requestId = requestId;
      res.setHeader('X-Request-ID', requestId);

      // Capture response
      const captureResponse = (body: any) => {
        res.send = originalSend;
        res.json = originalJson;

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Record request metric
        this.monitoringService.recordRequest({
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode,
          userId: (req as any).user?.id,
        });

        // Log slow requests
        if (duration > 1000) {
          this.monitoringService.log(
            'WARN',
            `Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`,
            'http',
            {
              requestId,
              method: req.method,
              path: req.path,
              duration,
              statusCode: res.statusCode,
            }
          );
        }

        return body;
      };

      res.send = function(body: any) {
        captureResponse(body);
        return originalSend.call(this, body);
      };

      res.json = function(body: any) {
        captureResponse(body);
        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Error monitoring middleware
   */
  errorMonitoring() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
      // Record error
      this.monitoringService.recordError(err, {
        requestId: (req as any).requestId,
        method: req.method,
        path: req.path,
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Log error
      this.monitoringService.log(
        'ERROR',
        err.message,
        'http',
        {
          requestId: (req as any).requestId,
          stack: err.stack,
          method: req.method,
          path: req.path,
        }
      );

      // Pass to next error handler
      next(err);
    };
  }

  /**
   * Performance monitoring for specific routes
   */
  routePerformance(routeName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();

      res.on('finish', async () => {
        const duration = performance.now() - startTime;

        // Record custom metric
        await this.monitoringService.recordCustomMetric({
          name: `route.performance.${routeName}`,
          type: 'HISTOGRAM',
          value: duration,
          tags: {
            method: req.method,
            statusCode: res.statusCode.toString(),
          },
        });
      });

      next();
    };
  }

  /**
   * Database query monitoring
   */
  databaseMonitoring() {
    return (req: Request, res: Response, next: NextFunction) => {
      // This would hook into Prisma middleware in a real implementation
      // For now, we'll just track overall database health
      
      (req as any).trackDatabaseQuery = async (queryName: string, duration: number) => {
        await this.monitoringService.recordCustomMetric({
          name: `database.query.${queryName}`,
          type: 'HISTOGRAM',
          value: duration,
        });

        if (duration > 100) {
          this.monitoringService.log(
            'WARN',
            `Slow database query: ${queryName} took ${duration.toFixed(2)}ms`,
            'database',
            { queryName, duration }
          );
        }
      };

      next();
    };
  }

  /**
   * Memory usage monitoring
   */
  memoryMonitoring() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const memUsage = process.memoryUsage();
      
      // Check if memory usage is high
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 500) { // 500MB threshold
        await this.monitoringService.recordCustomMetric({
          name: 'process.memory.high',
          type: 'GAUGE',
          value: heapUsedMB,
        });

        this.monitoringService.log(
          'WARN',
          `High memory usage: ${heapUsedMB.toFixed(2)}MB`,
          'system',
          { memoryUsage: memUsage }
        );
      }

      next();
    };
  }

  /**
   * API response time SLA monitoring
   */
  slaMonitoring(slaMs: number = 200) {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();

      res.on('finish', async () => {
        const duration = performance.now() - startTime;
        
        if (duration > slaMs) {
          await this.monitoringService.recordCustomMetric({
            name: 'sla.violation',
            type: 'COUNTER',
            value: 1,
            tags: {
              path: req.path,
              method: req.method,
              duration: duration.toString(),
            },
          });

          this.monitoringService.log(
            'WARN',
            `SLA violation: ${req.method} ${req.path} took ${duration.toFixed(2)}ms (SLA: ${slaMs}ms)`,
            'sla',
            {
              path: req.path,
              method: req.method,
              duration,
              sla: slaMs,
            }
          );
        }
      });

      next();
    };
  }

  /**
   * Distributed tracing middleware
   */
  tracing() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Extract or create trace context
      const traceId = req.get('X-Trace-ID') || 
        `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const parentSpanId = req.get('X-Span-ID');
      const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add to request context
      (req as any).trace = {
        traceId,
        spanId,
        parentSpanId,
      };

      // Add to response headers for downstream services
      res.setHeader('X-Trace-ID', traceId);
      res.setHeader('X-Span-ID', spanId);

      // Log with trace context
      const originalLog = this.monitoringService.log.bind(this.monitoringService);
      (req as any).log = (level: any, message: string, metadata?: any) => {
        return originalLog(level, message, 'app', {
          ...metadata,
          trace: (req as any).trace,
        });
      };

      next();
    };
  }

  /**
   * Business metrics monitoring
   */
  businessMetrics() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Track business events
      (req as any).trackBusinessMetric = async (
        metricName: string,
        value: number,
        tags?: Record<string, string>
      ) => {
        await this.monitoringService.recordCustomMetric({
          name: `business.${metricName}`,
          type: 'GAUGE',
          value,
          tags,
        });
      };

      // Track common business events
      res.on('finish', async () => {
        // Track successful API calls by endpoint
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await this.monitoringService.recordCustomMetric({
            name: 'api.success',
            type: 'COUNTER',
            value: 1,
            tags: {
              endpoint: req.path,
              method: req.method,
            },
          });
        }

        // Track user activity
        if ((req as any).user) {
          await this.monitoringService.recordCustomMetric({
            name: 'user.activity',
            type: 'COUNTER',
            value: 1,
            tags: {
              userId: (req as any).user.id,
              endpoint: req.path,
            },
          });
        }
      });

      next();
    };
  }

  /**
   * Health check endpoint
   */
  healthCheckEndpoint(path: string = '/health') {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.path === path) {
        try {
          const health = await this.monitoringService.getHealthStatus();
          const status = health.overall === 'HEALTHY' ? 200 : 503;
          
          res.status(status).json({
            status: health.overall,
            timestamp: new Date(),
            services: health.services,
            uptime: health.uptime,
          });
        } catch (error) {
          res.status(503).json({
            status: 'UNHEALTHY',
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Health check failed',
          });
        }
      } else {
        next();
      }
    };
  }

  /**
   * Metrics endpoint
   */
  metricsEndpoint(path: string = '/metrics') {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.path === path) {
        try {
          // Get current metrics
          const [system, application] = await Promise.all([
            this.monitoringService.collectSystemMetrics(),
            this.monitoringService.collectApplicationMetrics(),
          ]);

          // Format as Prometheus metrics (simplified)
          let output = '# HELP system_cpu_usage CPU usage percentage\n';
          output += '# TYPE system_cpu_usage gauge\n';
          output += `system_cpu_usage ${system.cpu.usage}\n\n`;

          output += '# HELP system_memory_usage Memory usage percentage\n';
          output += '# TYPE system_memory_usage gauge\n';
          output += `system_memory_usage ${system.memory.percentage}\n\n`;

          output += '# HELP http_requests_total Total HTTP requests\n';
          output += '# TYPE http_requests_total counter\n';
          output += `http_requests_total ${application.requests.total}\n\n`;

          output += '# HELP http_request_duration_ms HTTP request duration\n';
          output += '# TYPE http_request_duration_ms histogram\n';
          output += `http_request_duration_ms_avg ${application.response.averageTime}\n`;
          output += `http_request_duration_ms_p95 ${application.response.p95Time}\n`;
          output += `http_request_duration_ms_p99 ${application.response.p99Time}\n`;

          res.type('text/plain').send(output);
        } catch (error) {
          res.status(500).send('# Error collecting metrics\n');
        }
      } else {
        next();
      }
    };
  }
}