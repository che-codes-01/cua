// ─── Computer Actions Service – entry point ─────────────────────────────────
import express from 'express';
import { createServer } from 'http';
import { config }          from './config';
import { log }             from './logger';
import { RunnerHub }       from './ws/runnerHub';
import { adminKeyGuard }   from './middleware/adminKeyGuard';
import { adminRouter }     from './routes/admin';
import { authRouter }      from './routes/auth';
import { runnersRouter }   from './routes/runners';
import { sessionsRouter }  from './routes/sessions';
import { seedDemoData }    from './seed';

async function main() {
  const app = express();
  app.use(express.json());

  // ── HTTP server + WebSocket hub (must share the same server instance) ──────
  const server = createServer(app);
  const hub    = new RunnerHub(server);   // upgrades /runner/ws connections

  // ── Routes ────────────────────────────────────────────────────────────────
  // Owner-only: manage tenants and inspect global runner state
  app.use('/admin', adminKeyGuard, adminRouter());

  // Public: login / register
  app.use('/auth', authRouter());

  // Authenticated users: browse runners and manage sessions
  app.use('/api/runners',  runnersRouter(hub));
  app.use('/api/sessions', sessionsRouter(hub));

  // Health / readiness probe
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', ts: new Date().toISOString() }),
  );

  // ── Optional demo seed ────────────────────────────────────────────────────
  if (config.seedDemoData) await seedDemoData();

  // ── Start ─────────────────────────────────────────────────────────────────
  server.listen(config.port, () => {
    log.info(`Computer Actions Service  →  http://localhost:${config.port}`);
    log.info(`Runner WS        →  ws://localhost:${config.port}/runner/ws`);
    log.info(`Admin key        →  ${config.adminKey}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
