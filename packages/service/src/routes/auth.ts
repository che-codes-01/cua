// ─── Auth routes (public) ─────────────────────────────────────────────────────
//
//  POST /auth/register    create a user account within a tenant
//  POST /auth/login       exchange credentials for a JWT
//  GET  /auth/me          inspect the current token
//
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../store';
import { signToken } from '../auth';
import { authenticate } from '../middleware/authenticate';

export function authRouter(): Router {
  const router = Router();

  // ── Register ───────────────────────────────────────────────────────────────
  // Body: { tenantSlug, email, password, role? }
  // Typically called by the tenant admin to create employee accounts.
  router.post('/register', async (req, res) => {
    const { tenantSlug, email, password, role } = req.body as {
      tenantSlug?: string; email?: string; password?: string; role?: string;
    };

    if (!tenantSlug || !email || !password) {
      return res.status(400).json({ error: '`tenantSlug`, `email`, and `password` are required' });
    }

    const tenant = store.getTenantBySlug(tenantSlug);
    if (!tenant) return res.status(404).json({ error: `Tenant "${tenantSlug}" not found` });

    if (store.getUserByEmail(tenant.id, email)) {
      return res.status(409).json({ error: `Email "${email}" is already registered in this tenant` });
    }

    const user  = await store.createUser(tenant.id, email, password, role === 'admin' ? 'admin' : 'user');
    const token = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    });
  });

  // ── Login ──────────────────────────────────────────────────────────────────
  // Body: { tenantSlug, email, password }
  router.post('/login', async (req, res) => {
    const { tenantSlug, email, password } = req.body as {
      tenantSlug?: string; email?: string; password?: string;
    };

    if (!tenantSlug || !email || !password) {
      return res.status(400).json({ error: '`tenantSlug`, `email`, and `password` are required' });
    }

    const tenant = store.getTenantBySlug(tenantSlug);
    const user   = tenant ? store.getUserByEmail(tenant.id, email) : null;
    const valid  = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // Give the same error for wrong tenant / email / password (avoid enumeration)
    if (!tenant || !user || !valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });
    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    });
  });

  // ── Me ─────────────────────────────────────────────────────────────────────
  router.get('/me', authenticate, (req, res) => {
    const user = store.getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId });
  });

  return router;
}
