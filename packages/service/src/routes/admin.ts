// ─── Admin routes (Owner only – protected by x-admin-key header) ─────────────
//
//  POST   /admin/tenants            create a tenant
//  GET    /admin/tenants            list all tenants
//  GET    /admin/tenants/:id        get tenant + its runners + users
//  GET    /admin/runners            list every runner across all tenants
//
import { Router } from 'express';
import { store } from '../store';

export function adminRouter(): Router {
  const router = Router();

  // Create a new tenant (customer onboarding)
  router.post('/tenants', (req, res) => {
    const { name, slug } = req.body as { name?: string; slug?: string };
    if (!name || !slug) {
      return res.status(400).json({ error: '`name` and `slug` are required' });
    }
    if (store.getTenantBySlug(slug)) {
      return res.status(409).json({ error: `slug "${slug}" is already taken` });
    }
    const tenant = store.createTenant(name, slug);
    return res.status(201).json(tenant);    // includes the apiKey – share with customer
  });

  // List all tenants (overview)
  router.get('/tenants', (_req, res) => {
    res.json(store.getAllTenants());
  });

  // Tenant detail + its runners + its users (passwords redacted)
  router.get('/tenants/:id', (req, res) => {
    const tenant = store.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const runners = store.getRunnersByTenant(tenant.id);
    const users   = store.getUsersByTenant(tenant.id).map(u => ({
      id: u.id, email: u.email, role: u.role, createdAt: u.createdAt,
    }));

    return res.json({ ...tenant, runners, users });
  });

  // All runners across every tenant
  router.get('/runners', (_req, res) => {
    res.json(store.getAllRunners());
  });

  return router;
}
