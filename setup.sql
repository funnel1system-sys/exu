-- DC PASS PORTAL - SUPABASE DATABASE INITIALIZATION SCHEMA
-- Execute this within the 'SQL Editor' in your Supabase dashboard

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create the DC Passes Table
create table if not exists public.dc_passes (
  id uuid primary key default gen_random_uuid(),
  dc_number text not null unique,
  vehicle_number text not null,
  driver_name text not null,
  driver_mobile text not null,
  license_number text not null,
  mineral_name text not null,
  net_weight text not null,
  concession_holder text not null,
  source_place text not null,
  destination text not null,
  journey_start timestamp with time zone not null,
  journey_end timestamp with time zone not null,
  route_name text not null,
  transporter_name text not null,
  buyer_mobile text not null,
  pan_gstin text not null,
  gps_details text not null,
  purchaser_name text,
  distance text,
  duration text,
  royalty_issued text,
  checkpost text,
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('active', 'pending', 'expired')) default 'active' not null
);

-- 2. Turn on Row Level Security (RLS)
alter table public.dc_passes enable row level security;

-- 3. Create Security Policies (Simplified & Demo-friendly to prevent RLS errors)
-- Note: For seamless presentations/testing, we recommend either disabling RLS entirely or using these permissive policies.

-- Policy A: Select (Allow anyone to fetch, search, or verify passes)
drop policy if exists "Allow public read access to passes" on public.dc_passes;
create policy "Allow public read access to passes"
  on public.dc_passes for select
  using (true);

-- Policy B: Insert (Allow any client—both authenticated admin and guest fallback auto-inserts—to write)
drop policy if exists "Allow authenticated admin insertion" on public.dc_passes;
drop policy if exists "Allow public inserts" on public.dc_passes;
create policy "Allow public inserts"
  on public.dc_passes for insert
  with check (true);

-- Policy C: Update (Allow any client to update fields like statuses)
drop policy if exists "Allow authenticated admin edits" on public.dc_passes;
drop policy if exists "Allow public updates" on public.dc_passes;
create policy "Allow public updates"
  on public.dc_passes for update
  using (true)
  with check (true);

-- Policy D: Delete (Allow deletion of passes)
drop policy if exists "Allow authenticated admin deletes" on public.dc_passes;
drop policy if exists "Allow public deletes" on public.dc_passes;
create policy "Allow public deletes"
  on public.dc_passes for delete
  using (true);

-- ALTERNATIVE SOLUTION (Easiest for demo/presentation setup):
-- To completely bypass RLS blockers, execute this line:
-- alter table public.dc_passes disable row level security;


-- 4. Create public Storage Buckets ('dc-pdfs' and 'dc_passes_pdf') and policies
insert into storage.buckets (id, name, public) 
values ('dc-pdfs', 'dc-pdfs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('dc_passes_pdf', 'dc_passes_pdf', true)
on conflict (id) do nothing;

-- Ensure select access is public for both buckets
drop policy if exists "Public access to passes PDF files" on storage.objects;
create policy "Public access to passes PDF files"
  on storage.objects for select
  using (bucket_id in ('dc-pdfs', 'dc_passes_pdf'));

-- Allow upload (insert) permissions for anyone to avoid RLS storage exception
drop policy if exists "Authenticated admin upload pdf objects" on storage.objects;
drop policy if exists "Allow public upload to pdf buckets" on storage.objects;
create policy "Allow public upload to pdf buckets"
  on storage.objects for insert
  with check (bucket_id in ('dc-pdfs', 'dc_passes_pdf'));

-- Allow update permissions
drop policy if exists "Authenticated admin update pdf objects" on storage.objects;
drop policy if exists "Allow public updates to pdf buckets" on storage.objects;
create policy "Allow public updates to pdf buckets"
  on storage.objects for update
  using (bucket_id in ('dc-pdfs', 'dc_passes_pdf'));

-- Allow delete permissions
drop policy if exists "Authenticated admin delete pdf objects" on storage.objects;
drop policy if exists "Allow public deletes from pdf buckets" on storage.objects;
create policy "Allow public deletes from pdf buckets"
  on storage.objects for delete
  using (bucket_id in ('dc-pdfs', 'dc_passes_pdf'));

-- ALTERNATIVE STORAGE SOLUTION (Easiest for testing):
-- To completely bypass Storage rules, execute this:
-- alter table storage.objects disable row level security;
