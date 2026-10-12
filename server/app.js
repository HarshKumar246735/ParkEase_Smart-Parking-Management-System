import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { responseHelpers, notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy (needed for correct rate-limit IPs)
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // no Origin header = curl / server-to-server / health checks
      if (!origin || env.clientUrls.includes(origin.replace(/\/$/, ''))) return cb(null, true);
      return cb(null, false);
    },
    exposedHeaders: ['X-Server-Time', 'Content-Disposition'],
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(responseHelpers);

app.get('/api/health', (req, res) => res.ok({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
export default app;
