// ─── Admin API key guard ──────────────────────────────────────────────────────
// Only the service owner knows this key (set via ADMIN_KEY env var).
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function adminKeyGuard(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-admin-key'];
  if (key !== config.adminKey) {
    res.status(403).json({ error: 'Forbidden – invalid admin key' });
    return;
  }
  next();
}
