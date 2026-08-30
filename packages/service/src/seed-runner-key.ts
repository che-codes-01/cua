// ─── Seed a runner key into Supabase ─────────────────────────────────────────
//
// Run once to generate a workspace + runner key for local development:
//
//   npx tsx packages/service/src/seed-runner-key.ts
//
// Copy the printed key into packages/runner/.env as COMPUTER_ACTIONS_SERVICE_API_KEY
//
import './config';       // loads dotenv first
import { createHash, randomBytes } from 'crypto';
import { supabase } from './supabase';

async function main() {
  if (!supabase) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
  }

  // ── 1. Find or create a workspace ─────────────────────────────────────────
  let workspaceId: string;

  const { data: existing } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(1)
    .maybeSingle();

  if (existing) {
    workspaceId = existing.id;
    console.log(`Using existing workspace: "${existing.name}" (${workspaceId})`);
  } else {
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({ name: 'dev-workspace', slug: 'dev-workspace' })
      .select('id')
      .single();

    if (error || !ws) {
      console.error('Failed to create workspace:', error?.message);
      process.exit(1);
    }
    workspaceId = ws.id;
    console.log(`Created workspace: dev-workspace (${workspaceId})`);
  }

  // ── 2. Generate the key ────────────────────────────────────────────────────
  const secret = randomBytes(32).toString('base64url');
  const key    = `cak_live_${secret}`;
  const hash   = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 18);

  // ── 3. Insert into runner_keys ─────────────────────────────────────────────
  const { error: keyError } = await supabase
    .from('runner_keys')
    .insert({
      workspace_id: workspaceId,
      name:         'dev-runner-key',
      key_hash:     hash,
      key_prefix:   prefix,
    });

  if (keyError) {
    console.error('Failed to insert runner key:', keyError.message);
    process.exit(1);
  }

  // ── 4. Print instructions ──────────────────────────────────────────────────
  const sep = '─'.repeat(60);
  console.log('');
  console.log(sep);
  console.log('  Runner key created successfully');
  console.log(sep);
  console.log(`  workspace_id : ${workspaceId}`);
  console.log(`  key          : ${key}`);
  console.log('');
  console.log('  Add to packages/runner/.env:');
  console.log(`  COMPUTER_ACTIONS_SERVICE_API_KEY=${key}`);
  console.log(sep);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
