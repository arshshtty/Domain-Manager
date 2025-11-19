import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { DatabaseService } from './services/database';
import { DomainManagerService } from './services/domainManager';
import { createDomainsRouter } from './routes/domains';
import { createSettingsRouter } from './routes/settings';
import { createAIRouter } from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const db = new DatabaseService();
const manager = new DomainManagerService(db);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/domains', createDomainsRouter(manager));
app.use('/api/settings', createSettingsRouter(manager, db));
app.use('/api/ai', createAIRouter(manager, db));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: manager.getConfiguredProviders(),
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handling
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Configured providers: ${manager.getConfiguredProviders().join(', ') || 'none'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  db.close();
  process.exit(0);
});
