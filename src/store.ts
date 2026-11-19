import { createClient, type RedisClientOptions } from 'redis';
import type { Hotel } from './hotels';

export function createStore(options: RedisClientOptions = { url: process.env.REDIS_URL || 'redis://localhost:6379' }) {
  const redis = createClient({ ...options, disableOfflineQueue: true });
  redis.on('error', error => console.error('Redis:', error.message));

  async function saveAndFilter(city: string, hotels: Hotel[], min: number, max: number): Promise<Hotel[]> {
    const key = `hotels:${city}`;
    const transaction = redis.multi().del(key);
    if (hotels.length) {
      transaction.zAdd(key, hotels.map(hotel => ({ score: hotel.price, value: JSON.stringify(hotel) })));
      transaction.expire(key, 300);
    }
    // Read in the same transaction so concurrent requests cannot replace this result.
    const results = await transaction.zRangeByScore(key, min, max).execTyped();
    return (results.at(-1) as string[]).map(value => JSON.parse(value));
  }

  return { redis, saveAndFilter };
}
