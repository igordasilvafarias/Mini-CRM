-- Ativar RLS
alter table workspaces enable row level security;
alter table workspace_users enable row level security;
alter table leads enable row level security;
alter table stages enable row level security;
alter table stage_required_fields enable row level security;
alter table custom_fields enable row level security;
alter table lead_custom_values enable row level security;
alter table campaigns enable row level security;
alter table generated_messages enable row level security;