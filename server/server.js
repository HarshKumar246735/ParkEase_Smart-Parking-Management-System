import { env, assertEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';
import { startJobs } from './jobs/index.js';
import { reconcile } from './services/parkingAvailabilityService.js';

async function main() {
  assertEnv();
  await connectDB();
  await reconcile({ force: true }); // recover anything that came due while the server was asleep/restarting
  const stopJobs = startJobs();
  const server = app.listen(env.port, () => console.log(`[server] ParkEase API listening on :${env.port} (${env.nodeEnv})`));

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    console.log(`[server] ${signal} received, shutting down...`);
    stopJobs();
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
}

main().catch((err) => {
  console.error('[fatal] could not start server:', err.message);
  process.exit(1);
});
