// ─── Demo data seeder ─────────────────────────────────────────────────────────
// Runs on startup when SEED_DEMO_DATA=true.
// Creates a "Nike" tenant with an admin + a regular user so you can test
// the full flow without manual setup.

import { store } from './store';
import { log } from './logger';

export async function seedDemoData(): Promise<void> {
  const tenant = store.createTenant('Nike Inc.', 'nike');
  const admin  = await store.createUser(tenant.id, 'admin@nike.com',    'nike-admin-123', 'admin');
  const user   = await store.createUser(tenant.id, 'employee@nike.com', 'nike-user-123',  'user');

  const sep = '─'.repeat(52);
  log.info(sep);
  log.info('  Demo tenant seeded');
  log.info(`  Tenant slug  : nike`);
  log.info(`  Runner apiKey: ${tenant.apiKey}`);
  log.info(`  Admin user   : ${admin.email}  /  nike-admin-123`);
  log.info(`  Regular user : ${user.email}  /  nike-user-123`);
  log.info(sep);
}
