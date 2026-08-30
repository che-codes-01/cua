-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies + workspace owner trigger
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Trigger: auto-add workspace creator as owner member ────────────────────
--
-- Fires AFTER every INSERT on workspaces.
-- Inserts (workspace_id, owner_id, 'owner') into workspace_members so the
-- creator is always a member regardless of whether the application layer does
-- it too. ON CONFLICT DO NOTHING makes it safe to call twice.

CREATE OR REPLACE FUNCTION public.add_workspace_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.add_workspace_owner_as_member();


-- ── 2. RLS policies: workspace_members ───────────────────────────────────────
--
-- Users may only see their own membership rows.

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.workspace_members TO authenticated;

DROP POLICY IF EXISTS "workspace_members: members can view own row" ON public.workspace_members;
CREATE POLICY "workspace_members: members can view own row"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ── 3. RLS policies: runners ──────────────────────────────────────────────────
--
-- Users may see runners that belong to a workspace they are a member of.

ALTER TABLE public.runners ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.runners TO authenticated;

DROP POLICY IF EXISTS "runners: workspace members can view" ON public.runners;
CREATE POLICY "runners: workspace members can view"
  ON public.runners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   public.workspace_members wm
      WHERE  wm.workspace_id = runners.workspace_id
      AND    wm.user_id      = (select auth.uid())
    )
  );
