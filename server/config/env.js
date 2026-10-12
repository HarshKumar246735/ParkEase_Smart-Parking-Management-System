import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  tzOffset: process.env.APP_TZ_OFFSET || '+05:30',
  mallName: process.env.MALL_NAME || 'ParkEase Mall',
  jobIntervalMs: Number(process.env.JOB_INTERVAL_MS) || 10000,
};

export const isProd = env.nodeEnv === 'production';

export function assertEnv() {
  const missing = ['MONGO_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  }
  if (process.env.JWT_SECRET.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters (use 32+ random characters).');
  }
}
