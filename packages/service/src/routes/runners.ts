// ─── Runner routes (authenticated users) ─────────────────────────────────────
//
//  GET /api/runners          list all runners for my tenant
//  GET /api/runners/:id      get a single runner
//
// Runners are scoped to the tenant derived from the JWT – users can only
// see runners that belong to their own organisation.
//
import { Router } from 'express';
import { store } from '../store';
import { authenticate } from '../middleware/authenticate';
import type { RunnerHub } from '../ws/runnerHub';

export function runnersRouter(hub: RunnerHub): Router {
  const router = Router();
  router.use(authenticate);

  // List available runners for this tenant
  router.get('/', (req, res) => {
    const runners = store.getRunnersByTenant(req.user!.tenantId);
    // Enrich with live connection status from the hub
    const enriched = runners.map(r => ({ ...r, connected: hub.isOnline(r.id) }));
    res.json(enriched);
  });

  // Single runner detail
  router.get('/:id', (req, res) => {
    const runner = store.getRunnerById(req.params.id);
    if (!runner || runner.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Runner not found' });
    }
    return res.json({ ...runner, connected: hub.isOnline(runner.id) });
  });

  return router;
}
