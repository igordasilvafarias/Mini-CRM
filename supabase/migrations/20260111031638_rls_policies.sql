-- Workspaces (apenas membros podem ver)
create policy "workspace members" on workspaces
for select using (
  id in (
    select workspace_id from workspace_users
    where user_id = auth.uid()
  )
);

-- Leads
create policy "leads by workspace" on leads
for all using (
  workspace_id in (
    select workspace_id from workspace_users
    where user_id = auth.uid()
  )
);

-- Campaigns
create policy "campaigns by workspace" on campaigns
for all using (
  workspace_id in (
    select workspace_id from workspace_users
    where user_id = auth.uid()
  )
);

-- Stages
create policy "stages by workspace" on stages
for all using (
  workspace_id in (
    select workspace_id from workspace_users
    where user_id = auth.uid()
  )
);

-- Messages
create policy "messages by lead" on generated_messages
for all using (
  lead_id in (
    select id from leads
    where workspace_id in (
      select workspace_id from workspace_users
      where user_id = auth.uid()
    )
  )
);
