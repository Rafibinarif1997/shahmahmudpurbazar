-- SHAHMAHMUDPUR BAZAR / SUPABASE SETUP
-- Run this entire file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  price numeric(14,2) not null check(price >= 0),
  category text not null,
  subcategory text,
  description text,
  location text not null,
  phone text not null,
  image_urls text[] not null default '{}',
  status text not null default 'pending' check(status in ('pending','approved','rejected','sold')),
  views integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  ad_id uuid references public.ads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,ad_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references public.ads(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(ad_id,buyer_id,seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.hijama_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text not null,
  appointment_date date not null,
  appointment_time text not null,
  note text,
  status text not null default 'pending' check(status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check(status in ('open','reviewed','closed')),
  created_at timestamptz not null default now()
);

create index if not exists ads_category_idx on public.ads(category,subcategory);
create index if not exists ads_created_idx on public.ads(created_at desc);
create index if not exists ads_status_idx on public.ads(status);
create index if not exists messages_conv_idx on public.messages(conversation_id,created_at);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,name,phone) values(new.id,coalesce(new.raw_user_meta_data->>'name',''),coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict(id) do update set name=excluded.name,phone=excluded.phone;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and is_admin=true);
$$;

alter table public.profiles enable row level security;
alter table public.ads enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.hijama_appointments enable row level security;
alter table public.reports enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles for select using (true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);

-- Ads: anyone can read approved/sold ads; owner/admin can see their own pending/rejected.
drop policy if exists ads_select_public on public.ads;
create policy ads_select_public on public.ads for select using(status in ('approved','sold') or seller_id=auth.uid() or public.is_admin());
drop policy if exists ads_insert_owner on public.ads;
create policy ads_insert_owner on public.ads for insert to authenticated with check(seller_id=auth.uid());
drop policy if exists ads_update_owner_admin on public.ads;
create policy ads_update_owner_admin on public.ads for update using(seller_id=auth.uid() or public.is_admin()) with check(seller_id=auth.uid() or public.is_admin());
drop policy if exists ads_delete_owner_admin on public.ads;
create policy ads_delete_owner_admin on public.ads for delete using(seller_id=auth.uid() or public.is_admin());

-- Favorites
drop policy if exists fav_self on public.favorites;
create policy fav_self on public.favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Conversations: only participants/admins.
drop policy if exists conv_select on public.conversations;
create policy conv_select on public.conversations for select using(buyer_id=auth.uid() or seller_id=auth.uid() or public.is_admin());
drop policy if exists conv_insert on public.conversations;
create policy conv_insert on public.conversations for insert to authenticated with check(buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists conv_update on public.conversations;
create policy conv_update on public.conversations for update using(buyer_id=auth.uid() or seller_id=auth.uid() or public.is_admin());

-- Messages: participant can read/write.
drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages for select using(exists(select 1 from public.conversations c where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid() or public.is_admin())));
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.conversations c where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())));

-- Hijama: users create/read their own; admins see all.
drop policy if exists hijama_insert on public.hijama_appointments;
create policy hijama_insert on public.hijama_appointments for insert to authenticated with check(user_id=auth.uid());
drop policy if exists hijama_select on public.hijama_appointments;
create policy hijama_select on public.hijama_appointments for select using(user_id=auth.uid() or public.is_admin());
drop policy if exists hijama_update on public.hijama_appointments;
create policy hijama_update on public.hijama_appointments for update using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());

-- Reports
drop policy if exists report_insert on public.reports;
create policy report_insert on public.reports for insert to authenticated with check(reporter_id=auth.uid());
drop policy if exists report_select on public.reports;
create policy report_select on public.reports for select using(reporter_id=auth.uid() or public.is_admin());
drop policy if exists report_update_admin on public.reports;
create policy report_update_admin on public.reports for update using(public.is_admin()) with check(public.is_admin());

-- Storage bucket for listing photos.
insert into storage.buckets(id,name,public) values('ads-images','ads-images',true) on conflict(id) do nothing;

drop policy if exists ads_images_public_read on storage.objects;
create policy ads_images_public_read on storage.objects for select using(bucket_id='ads-images');
drop policy if exists ads_images_auth_upload on storage.objects;
create policy ads_images_auth_upload on storage.objects for insert to authenticated with check(bucket_id='ads-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists ads_images_owner_update on storage.objects;
create policy ads_images_owner_update on storage.objects for update to authenticated using(bucket_id='ads-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists ads_images_owner_delete on storage.objects;
create policy ads_images_owner_delete on storage.objects for delete to authenticated using(bucket_id='ads-images' and (storage.foldername(name))[1]=auth.uid()::text);

-- Realtime (safe to run; duplicates are ignored by exception block).
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

create or replace function public.increment_ad_views(ad_id uuid) returns void language sql security definer set search_path=public as $$ update public.ads set views=views+1 where id=ad_id; $$;
