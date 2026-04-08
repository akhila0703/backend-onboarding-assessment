import { Worker } from 'bullmq';
import { redis } from '../redis/redis.service';

export const exportWorker = new Worker(
  'export-queue',
  async (job) => {
    console.log('🚀 Job started:', job.name);

    // 🔥 ADD THIS BLOCK HERE
    if (Math.random() < 0.5) {
      console.log('❌ Simulated failure');
      throw new Error('Random failure');
    }

    // simulate work
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('✅ Job completed:', job.name);

    return { success: true };
  },
  {
    connection: redis,
  },
);