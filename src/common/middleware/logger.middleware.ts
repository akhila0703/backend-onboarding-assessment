import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      console.log(
        JSON.stringify({
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
