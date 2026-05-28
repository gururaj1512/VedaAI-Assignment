import { ConnectionOptions } from 'bullmq';
import { config } from './env';

let connectionOptions: ConnectionOptions;

if (config.REDIS.URL) {
  try {
    const parsed = new URL(config.REDIS.URL);
    connectionOptions = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
      tls: config.REDIS.URL.startsWith('rediss://')
        ? { rejectUnauthorized: false }
        : undefined,
    };
    console.log(`Redis Config: Connected via URL to host ${parsed.hostname}`);
  } catch (err) {
    console.error('Failed to parse REDIS_URL, falling back to host/port configuration', err);
    connectionOptions = {
      host: config.REDIS.HOST,
      port: config.REDIS.PORT,
      maxRetriesPerRequest: null,
    };
    console.log(`Redis Config: Host=${connectionOptions.host}, Port=${connectionOptions.port}`);
  }
} else {
  connectionOptions = {
    host: config.REDIS.HOST,
    port: config.REDIS.PORT,
    maxRetriesPerRequest: null,
  };
  console.log(`Redis Config: Host=${connectionOptions.host}, Port=${connectionOptions.port}`);
}

export const redisConfig = connectionOptions;
