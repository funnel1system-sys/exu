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
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('active', 'pending', 'expired')) default 'active' not null
);

-- 2. Turn on Row Level Security (RLS)
alter table public.dc_passes enable row level security;

-- 3. Create Security Policies
-- Anyone (public guest) can read/verify a DC pass by its number
create policy "Allow public read access to passes"
  on public.dc_passes for select
  using (true);

-- Only authenticated administrators can insert passes
create policy "Allow authenticated admin insertion"
  on public.dc_passes for insert
  with check (auth.role() = 'authenticated');

-- Only authenticated administrators can update passes
create policy "Allow authenticated admin edits"
  on public.dc_passes for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Only authenticated administrators can delete passes
create policy "Allow authenticated admin deletes"
  on public.dc_passes for delete
  using (auth.role() = 'authenticated');

-- 4. Create public Storage Bucket for PDF uploads
-- Run inside Supabase storage, or via SQL:
insert into storage.buckets (id, name, public) 
values ('dc_passes_pdf', 'dc_passes_pdf', true)
on conflict (id) do nothing;

-- Create storage policies
create policy "Public access to passes PDF files"
  on storage.objects for select
  using (bucket_id = 'dc_passes_pdf');

create policy "Authenticated admin upload pdf objects"
  on storage.objects for insert
  with check (bucket_id = 'dc_passes_pdf' and auth.role() = 'authenticated');

create policy "Authenticated admin update pdf objects"
  on storage.objects for update
  using (bucket_id = 'dc_passes_pdf' and auth.role() = 'authenticated');

create policy "Authenticated admin delete pdf objects"
  on storage.objects for delete
  using (bucket_id = 'dc_passes_pdf' and auth.role() = 'authenticated');
