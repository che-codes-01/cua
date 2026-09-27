-- Enrich workflow_executions for monitoring / logs
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS trigger_source TEXT NOT NULL DEFAULT 'webhook',
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS steps_total INTEGER,
  ADD COLUMN IF NOT EXISTS steps_completed INTEGER,
  ADD COLUMN IF NOT EXISTS logs JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Order executions newest-first per workflow efficiently
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at
  ON public.workflow_executions(started_at DESC);
