create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  part text not null check (part in ('기획', '디자인', 'FE', 'BE')),
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "team_members are publicly readable"
  on public.team_members
  for select
  using (true);
