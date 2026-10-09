-- 0001_init: releases, tracks, drop_alerts + RLS + storage buckets.
-- Source of truth: spec art_KNLqh1Wv ("Data model") with the CHAMPION
-- amendment (release_date nullable so an upcoming album can have a TBA date).

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type release_type as enum ('single', 'ep', 'album');

create table releases (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,                 -- url key, e.g. 'dreams-ii'
  title            text not null,
  type             release_type not null default 'single',
  description      text,
  release_date     date,                                 -- null = date TBA (upcoming)
  artwork_path     text,                                 -- storage key (carried: thumb_path)
  artwork_url      text,                                 -- resolved public url (carried: thumb_url)
  covnant_cbt_code text,                                 -- manual hand-off from Covnant /assets/new
  covnant_url      text,                                 -- optional deep link
  dsp_links        jsonb not null default '{}'::jsonb,   -- {"spotify": "...", "apple": "..."}; doubles as pre-save map before release day
  meta             jsonb not null default '{}'::jsonb,   -- carried
  published        boolean not null default false,       -- carried, but default FALSE (drafts are safe)
  featured         boolean not null default false,       -- carried
  sort_order       int not null default 0,               -- carried
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table tracks (
  id               uuid primary key default gen_random_uuid(),
  release_id       uuid not null references releases(id) on delete cascade,
  position         int not null,
  title            text not null,
  duration_seconds int,
  audio_path       text not null,                        -- storage key (carried: file_path)
  audio_url        text,                                 -- resolved public url (carried: file_url)
  isrc             text,
  credits          text,
  unique (release_id, position)
);

create table drop_alerts (
  id                uuid primary key default gen_random_uuid(),
  email             citext not null unique,
  source            text not null default 'site',        -- 'home' | 'release:<slug>' | 'story'
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at        timestamptz not null default now()
);

create index on releases (published, release_date desc);
create index on tracks (release_id, position);

-- Keep releases.updated_at honest without relying on the writer to set it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger releases_set_updated_at
  before update on releases
  for each row execute function set_updated_at();

alter table releases    enable row level security;
alter table tracks      enable row level security;
alter table drop_alerts enable row level security;

-- carried from Emergent: anonymous public read of published rows only
create policy "public read published releases"
  on releases for select
  using (published = true);

create policy "public read tracks of published releases"
  on tracks for select
  using (exists (select 1 from releases r where r.id = release_id and r.published));

-- drop_alerts: no anon policy at all; inserts go through the server action with the service role

-- Public storage buckets: artwork/<slug>.jpg and audio/<slug>/01.mp3 ...
insert into storage.buckets (id, name, public)
values ('artwork', 'artwork', true), ('audio', 'audio', true)
on conflict (id) do nothing;
