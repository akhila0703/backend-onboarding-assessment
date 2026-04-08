import Redis from 'ioredis';

export const redis = new Redis({
  host: 'localhost',
  port: 6379,

  // 🔥 IMPORTANT FIX FOR BULLMQ
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});