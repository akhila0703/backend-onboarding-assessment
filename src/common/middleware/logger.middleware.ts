import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    const requestId = req.headers['x-request-id'] || randomUUID();

    req['requestId'] = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - start;

      // ✅ metrics
      this.metricsService.recordRequest(durationMs, res.statusCode);

      // ✅ structured logs
      console.log(
        JSON.stringify({
          requestId,
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs,
          timestamp: new Date().toISOString(),
        }),
      );
    });

    next();
  }
}