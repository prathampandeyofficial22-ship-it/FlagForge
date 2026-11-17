import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// Load .env from root or server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Database & Cache
  MONGODB_URI: z.string().default('mongodb://localhost:27017/flagforge'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_ENABLED: z.coerce.boolean().default(false), // default false so server runs without requiring external Redis

  // JWT & Security
  JWT_SECRET: z.string().min(16).default('flagforge-default-secret-key-32-chars-long!'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  EVALUATION_RATE_LIMIT_MAX: z.coerce.number().default(1000),
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment configuration validation error:', error.format());
  }
  throw new Error('Invalid environment configuration');
}

export { config };
