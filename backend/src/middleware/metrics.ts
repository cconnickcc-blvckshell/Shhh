import { Request, Response, NextFunction } from 'express';
import { Registry, Counter, Histogram } from 'prom-client';

export const register = new Registry();

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const workerJobFailuresTotal = new Counter({
  name: 'worker_job_failures_total',
  help: 'Total worker job failures (after all retries)',
  labelNames: ['job'],
  registers: [register],
});

function normalizeRoute(path: string): string {
  const match = path.match(/^\/v1\/([^/]+)/);
  return match ? `/v1/${match[1]}` : path || '/';
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const route = normalizeRoute(req.path);

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const status = res.statusCode.toString();
    httpRequestsTotal.inc({ method: req.method, route, status });
    httpRequestDuration.observe({ method: req.method, route }, duration);
  });

  next();
}

export function metricsHandler(_req: Request, res: Response) {
  res.set('Content-Type', register.contentType);
  register.metrics().then((metrics) => res.send(metrics)).catch(() => res.status(500).send(''));
}
