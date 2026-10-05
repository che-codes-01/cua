// ─── Execute route – receives workflow actions from webhook trigger ──────────
import { Router } from 'express';
import type { RunnerHub } from '../ws/runnerHub';

export function executeRouter(hub: RunnerHub) {
  const router = Router();

  // POST /api/execute – dispatch actions to a runner
  router.post('/', async (req, res) => {
    const { runnerId, executionId, actions, payload } = req.body;

    if (!runnerId || !executionId || !actions) {
      return res.status(400).json({ error: 'Missing runnerId, executionId, or actions' });
    }

    // Find the runner
    const runner = hub.getRunner(runnerId);
    if (!runner) {
      return res.status(404).json({ error: 'Runner not found or offline' });
    }

    // Execute actions sequentially
    const results: unknown[] = [];
    
    try {
      for (const action of actions) {
        // For assert_result_contains, inject the serialised output of the
        // immediately preceding step so the runner can evaluate the assertion.
        let actionToSend = action;
        if (
          action &&
          typeof action === 'object' &&
          (action as { type: string }).type === 'assert_result_contains' &&
          results.length > 0
        ) {
          const prev = results[results.length - 1];
          const previousResult =
            prev && typeof prev === 'object'
              ? (prev as { text?: string }).text ??
                JSON.stringify(prev)
              : String(prev);
          actionToSend = { ...action, previousResult };
        }
        const result = await hub.sendAction(runnerId, actionToSend, executionId);
        results.push(result);
      }

      return res.json({
        success: true,
        executionId,
        results,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Execution failed',
        executionId,
        results,
        failedAt: results.length,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
