import { Queue } from 'bullmq';
import { redis } from '../redis/redis.service';

export const exportQueue = new Queue('export-queue', {
  connection: redis,
});