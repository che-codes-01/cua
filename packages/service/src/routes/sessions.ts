// ─── Session routes (authenticated users) ────────────────────────────────────
//
//  POST   /api/sessions              pick a runner → open a session
//  GET    /api/sessions              list my sessions
//  GET    /api/sessions/:id          get session detail
//  POST   /api/sessions/:id/actions  dispatch an action to the runner
//  DELETE /api/sessions/:id          close the session
//
// The service acts as a relay: it passes the action payload to the runner over
// the persistent WebSocket and waits for the result before responding to the
// HTTP caller.
//
import { Router } from 'express';
import { store } from '../store';
import { authenticate } from '../middleware/authenticate';
import type { RunnerHub } from '../ws/runnerHub';
import { log } from '../logger';

export function sessionsRouter(hub: RunnerHub): Router {
  const router = Router();
  router.use(authenticate);

  // ── Open a session ─────────────────────────────────────────────────────────
  // Body: { runnerId }
  router.post('/', (req, res) => {
    const { runnerId } = req.body as { runnerId?: string };
    const { userId, tenantId } = req.user!;

    if (!runnerId) return res.status(400).json({ error: '`runnerId` is required' });

    const runner = store.getRunnerById(runnerId);
    if (!runner || runner.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Runner not found' });
    }
    if (runner.status !== 'online') {
      return res.status(409).json({ error: `Runner is currently "${runner.status}" — cannot start a session` });
    }
    if (!hub.isOnline(runnerId)) {
      return res.status(503).json({ error: 'Runner is not connected to the service right now' });
    }

    const user    = store.getUserById(userId)!;
    const session = store.createSession(userId, runnerId, tenantId);

    const delivered = hub.requestSession(runnerId, session.id, userId, user.email);
    if (!delivered) {
      store.updateSessionStatus(session.id, 'closed');
      return res.status(503).json({ error: 'Failed to deliver session request to runner' });
    }

    log.info(`Session created: ${session.id} (user: ${user.email} → runner: ${runner.name})`);
    return res.status(201).json(session);
  });

  // ── List my sessions ───────────────────────────────────────────────────────
  router.get('/', (req, res) => {
    res.json(store.getSessionsByUser(req.user!.userId));
  });

  // ── Get session ────────────────────────────────────────────────────────────
  router.get('/:id', (req, res) => {
    const session = store.getSessionById(req.params.id);
    if (!session || session.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(session);
  });

  // ── Dispatch action ────────────────────────────────────────────────────────
  // Body: action payload (forwarded as-is to the runner)
  // Example: { type: "shell", command: "whoami" }
  router.post('/:id/actions', async (req, res) => {
    const session = store.getSessionById(req.params.id);
    if (!session || session.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status !== 'active') {
      return res.status(409).json({ error: `Session is "${session.status}" — only active sessions accept actions` });
    }

    try {
      const result = await hub.dispatchAction(session.runnerId, session.id, req.body);
      log.info(`Action completed in session ${session.id}`);
      return res.json({ result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      log.warn(`Action failed in session ${session.id}: ${message}`);
      return res.status(502).json({ error: message });
    }
  });

  // ── Close session ──────────────────────────────────────────────────────────
  router.delete('/:id', (req, res) => {
    const session = store.getSessionById(req.params.id);
    if (!session || session.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status === 'closed') {
      return res.status(409).json({ error: 'Session is already closed' });
    }

    hub.closeSession(session.runnerId, session.id);
    store.updateSessionStatus(session.id, 'closed');

    log.info(`Session closed: ${session.id}`);
    return res.json({ message: 'Session closed', sessionId: session.id });
  });

  return router;
}
