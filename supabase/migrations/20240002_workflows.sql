-- Workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Workflow',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  runner_id UUID REFERENCES public.runners(id) ON DELETE SET NULL,
  webhook_key_hash TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  runner_id UUID REFERENCES public.runners(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON public.workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_published ON public.workflows(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);

-- RLS policies for workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflows: owners can manage" ON public.workflows;
CREATE POLICY "workflows: owners can manage" ON public.workflows
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workflows.workspace_id
      AND w.owner_id = (SELECT auth.uid())
    )
  );

-- RLS policies for workflow_executions
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_executions: owners can view" ON public.workflow_executions;
CREATE POLICY "workflow_executions: owners can view" ON public.workflow_executions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows wf
      JOIN public.workspaces w ON w.id = wf.workspace_id
      WHERE wf.id = workflow_executions.workflow_id
      AND w.owner_id = (SELECT auth.uid())
    )
  );

-- Grant permissions
GRANT ALL ON public.workflows TO authenticated;
GRANT ALL ON public.workflow_executions TO authenticated;
GRANT ALL ON public.workflows TO service_role;
GRANT ALL ON public.workflow_executions TO service_role;
