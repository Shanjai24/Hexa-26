import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes/index.js';
import { config } from './config/index.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/uploads')) {
      console.log(`[HTTP] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

import { authenticate } from './middleware/auth.js';

// Serve uploaded photos publicly for browser img tags
app.use('/uploads/photos', express.static(path.join(process.cwd(), 'uploads', 'photos')));
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads', 'photos')));

// Serve other uploaded files with authentication
app.use('/uploads', authenticate as express.RequestHandler, express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'API route not found' }
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error] Unhandled exception:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Internal server error' }
  });
});

export default app;
