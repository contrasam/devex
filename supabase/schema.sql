-- DevEx Gamified Productivity Ticker
-- Supabase SQL Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Team members table
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null,
  avatar_seed text not null default '',
  current_price numeric(10, 2) not null default 100.00,
  base_price numeric(10, 2) not null default 100.00,
  open_tasks integer not null default 0,
  completed_tasks integer not null default 0,
  streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Price history for sparklines / charts
create table if not exists price_history (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references team_members(id) on delete cascade,
  price numeric(10, 2) not null,
  event_type text not null check (event_type in ('assigned', 'completed', 'overdue', 'streak', 'initial')),
  recorded_at timestamptz not null default now()
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  assigned_to uuid references team_members(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'overdue')),
  price_impact numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  due_date timestamptz
);

-- Ticker events feed (live activity log)
create table if not exists ticker_events (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references team_members(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  event_type text not null,
  description text not null,
  price_before numeric(10, 2) not null,
  price_after numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_price_history_member_id on price_history(member_id);
create index if not exists idx_price_history_recorded_at on price_history(recorded_at desc);
create index if not exists idx_tasks_assigned_to on tasks(assigned_to);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_ticker_events_member_id on ticker_events(member_id);
create index if not exists idx_ticker_events_created_at on ticker_events(created_at desc);

-- Updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_team_members_updated_at
  before update on team_members
  for each row execute function update_updated_at_column();

-- Seed some demo data
insert into team_members (name, role, avatar_seed, current_price, base_price, open_tasks, completed_tasks, streak)
values
  ('Alex Chen', 'Frontend Engineer', 'alex', 142.50, 100.00, 3, 12, 5),
  ('Priya Sharma', 'Backend Engineer', 'priya', 198.75, 100.00, 5, 28, 8),
  ('Jordan Lee', 'Full Stack Engineer', 'jordan', 87.30, 100.00, 1, 7, 2),
  ('Sam Rivera', 'DevOps Engineer', 'sam', 165.20, 100.00, 4, 19, 6),
  ('Casey Morgan', 'Designer', 'casey', 110.00, 100.00, 2, 9, 3);

-- Seed price history for each member
insert into price_history (member_id, price, event_type, recorded_at)
select
  m.id,
  prices.price,
  prices.event_type,
  now() - (interval '1 day' * prices.days_ago)
from team_members m
cross join lateral (
  values
    (100.00::numeric, 'initial'::text, 10),
    (105.00::numeric, 'assigned'::text, 9),
    (102.00::numeric, 'completed'::text, 8),
    (110.00::numeric, 'assigned'::text, 7),
    (115.00::numeric, 'streak'::text, 6),
    (112.00::numeric, 'assigned'::text, 5),
    (120.00::numeric, 'completed'::text, 4),
    (118.00::numeric, 'assigned'::text, 3),
    (125.00::numeric, 'completed'::text, 2),
    (m.current_price, 'assigned'::text, 0)
) as prices(price, event_type, days_ago)
on conflict do nothing;

-- Enable realtime on key tables
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table ticker_events;
alter publication supabase_realtime add table tasks;
