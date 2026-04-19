import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  totalRequests = 0;
  totalErrors = 0;

  latencyBuckets = {
    '0-50': 0,
    '51-200': 0,
    '201-1000': 0,
    '1000+': 0,
  };

  recordRequest(duration: number, statusCode: number) {
    this.totalRequests++;

    if (statusCode >= 400) {
      this.totalErrors++;
    }

    if (duration <= 50) this.latencyBuckets['0-50']++;
    else if (duration <= 200) this.latencyBuckets['51-200']++;
    else if (duration <= 1000) this.latencyBuckets['201-1000']++;
    else this.latencyBuckets['1000+']++;
  }

  getMetrics() {
    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      latencyBuckets: this.latencyBuckets,
    };
  }
}