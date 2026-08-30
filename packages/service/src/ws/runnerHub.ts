// ─── Runner WebSocket Hub ─────────────────────────────────────────────────────
//
// Runners connect here on  ws://host/runner/ws?apiKey=XXX&runnerId=YYY
//
// Auth flow:
//   1. Runner sends its workspace API key (cak_live_...) as a query param
//   2. Service hashes the key (SHA-256) and looks it up in Supabase runner_keys
//   3. If found → connection is accepted; runner is bound to that workspace
//   4. Runner sends a `register` message to record name/labels/version
//
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage, Server }    from 'http';
import { createHash }                 from 'crypto';
import { randomUUID }                 from 'crypto';
import { store }                      from '../store';
import { log }                        from '../logger';
import { supabase }                   from '../supabase';

// ── Protocol types (Runner ↔ Service) ─────────────────────────────────────────

interface RunnerMsg {
  type: string;
  [key: string]: unknown;
}

interface PendingAction {
  resolve: (result: unknown) => void;
  reject:  (err: Error)     => void;
  timer:   NodeJS.Timeout;
}

const ACTION_TIMEOUT_MS = 30_000;

// ── Key validation ─────────────────────────────────────────────────────────────
//
// Hashes the raw API key and looks it up in the Supabase runner_keys table.
// Returns the workspace_id the key belongs to, or null if invalid.

interface ValidatedKey {
  workspaceId:  string;
  runnerKeyId:  string;
}

async function validateRunnerKey(apiKey: string): Promise<ValidatedKey | null> {
  if (!apiKey)    return null;
  if (!supabase)  {
    log.warn('Supabase not configured – cannot validate runner key');
    return null;
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  const { data, error } = await supabase
    .from('runner_keys')
    .select('id, workspace_id')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error) {
    log.error('runner_keys lookup failed:', error.message);
    return null;
  }

  if (!data) return null;
  return { workspaceId: data.workspace_id, runnerKeyId: data.id };
}

// ── Hub ───────────────────────────────────────────────────────────────────────

export class RunnerHub {
  private wss:             WebSocketServer;
  /** runnerId → open WS connection */
  private connections    = new Map<string, WebSocket>();
  /** actionId → pending resolver */
  private pendingActions = new Map<string, PendingAction>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/runner/ws' });
    this.wss.on('connection', (ws, req) => this.onConnect(ws, req));
    log.info('RunnerHub listening on ws://.../runner/ws');
  }

  // ── Connection lifecycle ───────────────────────────────────────────────────

  private onConnect(ws: WebSocket, req: IncomingMessage): void {
    const url      = new URL(req.url!, 'http://localhost');
    const apiKey   = url.searchParams.get('apiKey')   ?? '';
    const runnerId = url.searchParams.get('runnerId') ?? randomUUID();

    // Buffer any messages that arrive during async auth so they are not lost.
    // (Some runners send `register` immediately on open before receiving `connected`.)
    const messageQueue: Buffer[] = [];
    const buffer = (raw: Buffer) => messageQueue.push(raw);
    ws.on('message', buffer);

    validateRunnerKey(apiKey)
      .then(validated => {
        ws.off('message', buffer);
        if (!validated) {
          log.warn(`Runner rejected – invalid API key  (runnerId: ${runnerId})`);
          ws.close(1008, 'Invalid API key');
          return;
        }
        this.setupConnection(ws, runnerId, validated.workspaceId, validated.runnerKeyId, messageQueue);
      })
      .catch(err => {
        ws.off('message', buffer);
        log.error('Runner auth error:', err);
        ws.close(1011, 'Authentication error');
      });
  }

  private setupConnection(ws: WebSocket, runnerId: string, workspaceId: string, runnerKeyId: string, buffered: Buffer[] = []): void {
    log.info(`Runner connected  id: ${runnerId}  workspace: ${workspaceId}`);
    this.connections.set(runnerId, ws);

    // Confirm connection to the runner
    this.send(ws, { type: 'connected', runnerId, workspaceId });

    // ── Inactivity watchdog ─────────────────────────────────────────────────
    const HEARTBEAT_TIMEOUT_MS = 90_000;
    let heartbeatTimer = setTimeout(() => ws.terminate(), HEARTBEAT_TIMEOUT_MS);
    const resetTimer   = () => {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => ws.terminate(), HEARTBEAT_TIMEOUT_MS);
    };
    ws.once('close', () => clearTimeout(heartbeatTimer));

    ws.on('message', (raw) => {
      resetTimer();
      try {
        this.onMessage(ws, runnerId, workspaceId, runnerKeyId, JSON.parse(raw.toString()) as RunnerMsg);
      } catch (err) {
        log.error(`Bad message from runner ${runnerId}:`, err);
      }
    });

    ws.on('close', () => {
      log.info(`Runner disconnected: ${runnerId}`);
      this.connections.delete(runnerId);
      store.setRunnerStatus(runnerId, 'offline')
        .catch(err => log.error('Failed to update runner status:', err));
    });

    ws.on('error', (err) => log.error(`Runner WS error (${runnerId}):`, err.message));

    // Replay any messages that arrived before auth completed
    for (const raw of buffered) {
      try {
        this.onMessage(ws, runnerId, workspaceId, runnerKeyId, JSON.parse(raw.toString()) as RunnerMsg);
      } catch (err) {
        log.error(`Bad buffered message from runner ${runnerId}:`, err);
      }
    }
  }

  // ── Incoming messages from runner ─────────────────────────────────────────

  private async onMessage(
    ws: WebSocket,
    runnerId: string,
    workspaceId: string,
    runnerKeyId: string,
    msg: RunnerMsg,
  ): Promise<void> {
    log.debug(`← runner[${runnerId}] ${msg.type}`);

    switch (msg.type) {

      case 'register': {
        const runner = await store.upsertRunner(
          runnerId,
          workspaceId,
          runnerKeyId,
          (msg.name    as string)   || runnerId,
          (msg.labels  as string[]) || [],
        );
        log.info(`Runner registered: "${runner.name}" (${runner.id}) labels=[${runner.labels}]`);
        this.send(ws, { type: 'registered', runnerId: runner.id, name: runner.name });
        break;
      }

      case 'heartbeat': {
        await store.touchRunner(runnerId);
        this.send(ws, { type: 'pong' });
        break;
      }

      case 'session_accepted': {
        const { sessionId } = msg as { type: string; sessionId: string };
        store.updateSessionStatus(sessionId, 'active');
        await store.setRunnerStatus(runnerId, 'busy');
        log.info(`Session active: ${sessionId}`);
        break;
      }

      case 'session_rejected': {
        const { sessionId, reason } = msg as { type: string; sessionId: string; reason?: string };
        store.updateSessionStatus(sessionId, 'closed');
        await store.setRunnerStatus(runnerId, 'online');
        log.warn(`Session rejected: ${sessionId} — ${reason ?? 'no reason'}`);
        break;
      }

      case 'session_closed': {
        const { sessionId } = msg as { type: string; sessionId: string };
        store.updateSessionStatus(sessionId, 'closed');
        await store.setRunnerStatus(runnerId, 'online');
        log.info(`Session closed by runner: ${sessionId}`);
        break;
      }

      case 'action_result': {
        const { actionId, result, error } = msg as {
          type: string; actionId: string; result: unknown; error: string | null;
        };
        const pending = this.pendingActions.get(actionId);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingActions.delete(actionId);
          error ? pending.reject(new Error(error)) : pending.resolve(result);
        }
        break;
      }

      default:
        log.warn(`Unknown runner message type: ${msg.type}`);
    }
  }

  // ── Public API (called by HTTP route handlers) ────────────────────────────

  getRunner(runnerId: string): WebSocket | undefined {
    const ws = this.connections.get(runnerId);
    if (ws && ws.readyState === WebSocket.OPEN) return ws;
    return undefined;
  }

  /** Get all currently connected runner IDs */
  getConnectedRunnerIds(): string[] {
    const connected: string[] = [];
    for (const [runnerId, ws] of this.connections.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        connected.push(runnerId);
      }
    }
    return connected;
  }

  /** Send an action to a runner and wait for the result (used by workflow execution) */
  sendAction(runnerId: string, action: unknown): Promise<unknown> {
    const ws = this.connections.get(runnerId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Runner is not connected'));
    }
    const actionId = randomUUID();
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingActions.delete(actionId);
        reject(new Error(`Action timed out after ${ACTION_TIMEOUT_MS / 1000}s`));
      }, ACTION_TIMEOUT_MS);

      this.pendingActions.set(actionId, { resolve, reject, timer });
      this.send(ws, { type: 'action', actionId, payload: action });
    });
  }

  requestSession(runnerId: string, sessionId: string, userId: string, userEmail: string): boolean {
    return this.sendToRunner(runnerId, { type: 'session_request', sessionId, userId, userEmail });
  }

  dispatchAction(runnerId: string, sessionId: string, payload: unknown): Promise<unknown> {
    const ws = this.connections.get(runnerId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Runner is not connected'));
    }
    const actionId = randomUUID();
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingActions.delete(actionId);
        reject(new Error(`Action timed out after ${ACTION_TIMEOUT_MS / 1000}s`));
      }, ACTION_TIMEOUT_MS);

      this.pendingActions.set(actionId, { resolve, reject, timer });
      this.send(ws, { type: 'action', actionId, sessionId, payload });
    });
  }

  closeSession(runnerId: string, sessionId: string): void {
    this.sendToRunner(runnerId, { type: 'close_session', sessionId });
    store.setRunnerStatus(runnerId, 'online');
  }

  isOnline(runnerId: string): boolean {
    const ws = this.connections.get(runnerId);
    return ws?.readyState === WebSocket.OPEN;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private sendToRunner(runnerId: string, data: object): boolean {
    const ws = this.connections.get(runnerId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    this.send(ws, data);
    return true;
  }

  private send(ws: WebSocket, data: object): void {
    log.debug(`→ runner ${JSON.stringify((data as RunnerMsg).type)}`);
    ws.send(JSON.stringify(data));
  }
}
