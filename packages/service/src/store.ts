// ─── In-memory data store (swap for a real DB in production) ─────────────────
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { log }      from './logger';

// ── Domain Types ───────────────────────────────────────────────────────────────

export interface Tenant {
  id:         string;
  name:       string;
  /** URL-safe slug used by users to identify their org, e.g. "nike" */
  slug:       string;
  /** Secret key given to customers so their runner agents can register */
  apiKey:     string;
  createdAt:  string;
}

export interface Runner {
  id:           string;
  tenantId:     string;
  name:         string;
  labels:       string[];
  /** 'online' = idle & connected, 'busy' = in a session, 'offline' = WS closed */
  status:       'online' | 'busy' | 'offline';
  version:      string;
  lastSeen:     string;
  registeredAt: string;
}

export interface User {
  id:           string;
  tenantId:     string;
  email:        string;
  passwordHash: string;
  role:         'admin' | 'user';
  createdAt:    string;
}

export interface Session {
  id:        string;
  userId:    string;
  runnerId:  string;
  tenantId:  string;
  /** pending → waiting for runner to accept | active → live | closed */
  status:    'pending' | 'active' | 'closed';
  createdAt: string;
  closedAt?: string;
}

// ── Store Class ────────────────────────────────────────────────────────────────

class Store {
  private tenants  = new Map<string, Tenant>();
  private runners  = new Map<string, Runner>();
  private users    = new Map<string, User>();
  private sessions = new Map<string, Session>();

  // ── Tenants ─────────────────────────────────────────────────────────────────

  createTenant(name: string, slug: string, apiKey?: string): Tenant {
    const tenant: Tenant = {
      id:        randomUUID(),
      name,
      slug:      slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      apiKey:    apiKey ?? randomUUID().replace(/-/g, ''),
      createdAt: new Date().toISOString(),
    };
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  getTenantById(id: string):            Tenant | null { return this.tenants.get(id)                                              ?? null; }
  getTenantBySlug(slug: string):        Tenant | null { return [...this.tenants.values()].find(t => t.slug === slug)             ?? null; }
  getTenantByApiKey(apiKey: string):    Tenant | null { return [...this.tenants.values()].find(t => t.apiKey === apiKey)         ?? null; }
  getAllTenants():                       Tenant[]      { return [...this.tenants.values()]; }

  // ── Users ────────────────────────────────────────────────────────────────────

  async createUser(tenantId: string, email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> {
    const user: User = {
      id:           randomUUID(),
      tenantId,
      email:        email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 12),
      role,
      createdAt:    new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: string):                               User | null { return this.users.get(id) ?? null; }
  getUserByEmail(tenantId: string, email: string):       User | null {
    return [...this.users.values()].find(u => u.tenantId === tenantId && u.email === email.toLowerCase().trim()) ?? null;
  }
  getUsersByTenant(tenantId: string):                    User[]      { return [...this.users.values()].filter(u => u.tenantId === tenantId); }

  // ── Runners ──────────────────────────────────────────────────────────────────

  /** Creates or refreshes a runner record when it (re-)connects. */
  async upsertRunner(id: string, tenantId: string, runnerKeyId: string, name: string, labels: string[]): Promise<Runner> {
    const existing = this.runners.get(id);
    const runner: Runner = {
      id, tenantId, name, labels,
      version:      '',
      status:       'online',
      lastSeen:     new Date().toISOString(),
      registeredAt: existing?.registeredAt ?? new Date().toISOString(),
    };
    this.runners.set(id, runner);

    const { error } = await supabase?.from('runners').upsert({
      id:             runner.id,
      workspace_id:   tenantId,
      runner_key_id:  runnerKeyId,
      name:           runner.name,
      status:         'online',
      labels:         runner.labels,
      last_seen_at:   runner.lastSeen,
    }) ?? {};
    if (error) log.error('upsertRunner Supabase error:', error.message);

    return runner;
  }

  async setRunnerStatus(id: string, status: Runner['status']): Promise<void> {
    const r = this.runners.get(id);
    if (r) {
      r.status = status;
      r.lastSeen = new Date().toISOString();

      const { error } = await supabase?.from('runners').update({
        status,
        last_seen_at: r.lastSeen,
      }).eq('id', id) ?? {};
      if (error) log.error('setRunnerStatus Supabase error:', error.message);
    }
  }

  /** Update lastSeen without changing status (used by heartbeat handler). */
  async touchRunner(id: string): Promise<void> {
    const r = this.runners.get(id);
    if (r) {
      r.lastSeen = new Date().toISOString();
      const { error } = await supabase?.from('runners').update({
        last_seen_at: r.lastSeen,
      }).eq('id', id) ?? {};
      if (error) log.error('touchRunner Supabase error:', error.message);
    }
  }

  getRunnerById(id: string):             Runner | null { return this.runners.get(id) ?? null; }
  getRunnersByTenant(tenantId: string):  Runner[]      { return [...this.runners.values()].filter(r => r.tenantId === tenantId); }
  getAllRunners():                        Runner[]      { return [...this.runners.values()]; }

  // ── Sessions ─────────────────────────────────────────────────────────────────

  createSession(userId: string, runnerId: string, tenantId: string): Session {
    const session: Session = {
      id:        randomUUID(),
      userId, runnerId, tenantId,
      status:    'pending',
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSessionById(id: string):            Session | null { return this.sessions.get(id) ?? null; }
  getSessionsByUser(userId: string):     Session[]      { return [...this.sessions.values()].filter(s => s.userId === userId); }

  updateSessionStatus(id: string, status: Session['status']): void {
    const s = this.sessions.get(id);
    if (s) {
      s.status = status;
      if (status === 'closed') s.closedAt = new Date().toISOString();
    }
  }
}

export const store = new Store();
