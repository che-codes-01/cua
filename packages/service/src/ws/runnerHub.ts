// ─── Runner WebSocket Hub ─────────────────────────────────────────────────────
//
// Runners connect here on  ws://host/runner/ws?apiKey=XXX&runnerId=YYY
// Once authenticated the hub:
//   • keeps the live WS connection in a Map
//   • forwards session requests / actions from the HTTP API to the runner
//   • handles heartbeats and status transitions
//
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage, Server } from 'http';
import { randomUUID } from 'crypto';
import { store } from '../store';
import { log } from '../logger';

// ── Protocol types (Runner ↔ Service) ─────────────────────────────────────────

interface RunnerMsg {
  type: string;
  [key: string]: unknown;
}

// Pending action callbacks waiting for runner's action_result
interface PendingAction {
  resolve: (result: unknown) => void;
  reject:  (err: Error)     => void;
  timer:   NodeJS.Timeout;
}

const ACTION_TIMEOUT_MS = 30_000;

// ── Hub ───────────────────────────────────────────────────────────────────────

export class RunnerHub {
  private wss:            WebSocketServer;
  /** runnerId → open WS connection */
  private connections   = new Map<string, WebSocket>();
  /** actionId → pending resolver */
  private pendingActions= new Map<string, PendingAction>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/runner/ws' });
    this.wss.on('connection', (ws, req) => this.onConnect(ws, req));
    log.info('RunnerHub listening on ws://.../runner/ws');
  }

  // ── Connection lifecycle ───────────────────────────────────────────────────

  private onConnect(ws: WebSocket, req: IncomingMessage): void {
    const url    = new URL(req.url!, 'http://localhost');
    const apiKey = url.searchParams.get('apiKey') ?? '';
    // Runners may pass a stable self-generated UUID so they survive reconnects
    const runnerId = url.searchParams.get('runnerId') ?? randomUUID();

    const tenant = store.getTenantByApiKey(apiKey);
    if (!tenant) {
      log.warn(`Runner WS rejected – bad apiKey (id hint: ${runnerId})`);
      ws.close(1008, 'Invalid API key');
      return;
    }

    log.info(`Runner connected: ${runnerId}  tenant: ${tenant.slug}`);
    this.connections.set(runnerId, ws);

    // Tell runner its resolved identity + tenant info
    this.send(ws, {
      type:       'connected',
      runnerId,
      tenantId:   tenant.id,
      tenantName: tenant.name,
    });

    // ── Inactivity watchdog ───────────────────────────────────────────────────────────────
    // Terminate the socket if no message arrives within HEARTBEAT_TIMEOUT_MS.
    // The timer is reset on EVERY incoming message so normal heartbeats (every
    // 30 s) keep the connection alive indefinitely.
    const HEARTBEAT_TIMEOUT_MS = 90_000;
    let   heartbeatTimer       = setTimeout(() => ws.terminate(), HEARTBEAT_TIMEOUT_MS);
    const resetTimer           = () => {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => ws.terminate(), HEARTBEAT_TIMEOUT_MS);
    };
    ws.once('close', () => clearTimeout(heartbeatTimer));

    ws.on('message', (raw) => {
      resetTimer();
      try {
        this.onMessage(ws, runnerId, tenant.id, JSON.parse(raw.toString()) as RunnerMsg);
      } catch (err) {
        log.error(`Bad message from runner ${runnerId}:`, err);
      }
    });

    ws.on('close', () => {
      log.info(`Runner disconnected: ${runnerId}`);
      this.connections.delete(runnerId);
      store.setRunnerStatus(runnerId, 'offline').catch(err => log.error('Failed to update runner status:', err));
    });

    ws.on('error', (err) => log.error(`Runner WS error (${runnerId}):`, err.message));
  }

  // ── Incoming messages from runner ─────────────────────────────────────────

  private async onMessage(ws: WebSocket, runnerId: string, tenantId: string, msg: RunnerMsg): Promise<void> {
    log.debug(`← runner[${runnerId}] ${msg.type}`);

    switch (msg.type) {

      // Runner announces itself after connecting
      case 'register': {
        const runner = await store.upsertRunner(
          runnerId,
          tenantId,
          (msg.name   as string)   || runnerId,
          (msg.labels as string[]) || [],
          (msg.version as string)  || '0.0.0',
        );
        log.info(`Runner registered: "${runner.name}" (${runner.id}) labels=[${runner.labels}]`);
        this.send(ws, { type: 'registered', runnerId: runner.id, name: runner.name });
        break;
      }

      // Runner is alive — reply with pong.
      // Do NOT call setRunnerStatus here: the runner may be 'busy' (active
      // session) and flipping it back to 'online' would allow a second session
      // to be opened concurrently, causing interleaved actions.
      case 'heartbeat': {
        await store.touchRunner(runnerId);
        this.send(ws, { type: 'pong' });
        break;
      }

      // Runner accepted a session request
      case 'session_accepted': {
        const { sessionId } = msg as { type: string; sessionId: string };
        store.updateSessionStatus(sessionId, 'active');
        await store.setRunnerStatus(runnerId, 'busy');
        log.info(`Session active: ${sessionId}`);
        break;
      }

      // Runner rejected a session (e.g. already busy by external policy)
      case 'session_rejected': {
        const { sessionId, reason } = msg as { type: string; sessionId: string; reason?: string };
        store.updateSessionStatus(sessionId, 'closed');
        await store.setRunnerStatus(runnerId, 'online');
        log.warn(`Session rejected: ${sessionId} — ${reason ?? 'no reason'}`);
        break;
      }

      // Runner closed a session from its side
      case 'session_closed': {
        const { sessionId } = msg as { type: string; sessionId: string };
        store.updateSessionStatus(sessionId, 'closed');
        await store.setRunnerStatus(runnerId, 'online');
        log.info(`Session closed by runner: ${sessionId}`);
        break;
      }

      // Runner returns action result
      case 'action_result': {
        const { actionId, result, error } = msg as {
          type: string;
          actionId: string;
          result: unknown;
          error: string | null;
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

  /**
   * Send a session request to the runner.
   * Returns false if the runner is not connected.
   */
  requestSession(runnerId: string, sessionId: string, userId: string, userEmail: string): boolean {
    return this.sendToRunner(runnerId, { type: 'session_request', sessionId, userId, userEmail });
  }

  /**
   * Relay an action to the runner and await its result.
   * Rejects after ACTION_TIMEOUT_MS if no response.
   */
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

  /**
   * Tell the runner to close a session, then mark it closed on our side too.
   */
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
