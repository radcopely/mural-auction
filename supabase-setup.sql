-- ============================================================
-- MURAL AUCTION — Supabase Database Setup
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. MURALS table
create table if not exists murals (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  title        text not null,
  artist       text not null,
  description  text default '',
  status       text default 'not-started' check (status in ('not-started', 'in-progress', 'complete')),
  starting_bid numeric(10,2) not null default 100,
  current_bid  numeric(10,2) not null default 100,
  auction_end  timestamptz not null,
  photos       text[] default '{}'  -- array of image URLs
);

-- 2. BIDS table
create table if not exists bids (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  mural_id     uuid not null references murals(id) on delete cascade,
  bidder_name  text not null,
  bidder_email text not null,
  amount       numeric(10,2) not null
);

-- 3. Indexes for performance
create index if not exists bids_mural_id_idx on bids(mural_id);
create index if not exists bids_created_at_idx on bids(created_at desc);
create index if not exists murals_status_idx on murals(status);

-- 4. Row Level Security — allow public reads, public bid inserts
--    Admin writes are handled via the service role (or anon key with policies below)

alter table murals enable row level security;
alter table bids   enable row level security;

-- Anyone can read murals
create policy "Public can read murals"
  on murals for select using (true);

-- Anyone can read bids
create policy "Public can read bids"
  on bids for select using (true);

-- Anyone can place a bid (insert only)
create policy "Public can place bids"
  on bids for insert with check (true);

-- Anyone can insert murals (admin panel — protected by app-level password)
create policy "Public can insert murals"
  on murals for insert with check (true);

-- Anyone can update murals (admin panel — protected by app-level password)
create policy "Public can update murals"
  on murals for update using (true);

-- 5. Enable Realtime for bids table (so new bids appear live)
alter publication supabase_realtime add table bids;

-- ============================================================
-- DONE. Your database is ready.
-- ============================================================
