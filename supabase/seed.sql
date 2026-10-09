-- Seed: launch-day state. Loaded by `supabase db reset` after migrations.
--
-- CHAMPION is the home-page flagship (spec amendment): published + featured
-- with no date, no tracks, no pre-save links yet. Yeshua fills cover art,
-- dsp_links, and release_date in Supabase Studio as they arrive.
insert into releases (slug, title, type, description, release_date, published, featured, dsp_links)
values (
  'champion',
  'CHAMPION',
  'album',
  'Recorded in Austin. Drops here first.',
  null,
  true,
  true,
  '{}'::jsonb
)
on conflict (slug) do nothing;

-- Unpublished draft fixture: must never be visible to the anon role.
-- Tests assert this row is invisible; it is harmless if it reaches a real
-- project because published = false.
insert into releases (slug, title, type, description, release_date, published, featured)
values (
  'draft-fixture',
  'Draft Fixture',
  'single',
  'Unpublished test row. Not fan-visible.',
  '2020-01-01',
  false,
  false
)
on conflict (slug) do nothing;

insert into tracks (release_id, position, title, audio_path)
select id, 1, 'Draft Track', 'audio/draft-fixture/01.mp3'
from releases where slug = 'draft-fixture'
on conflict (release_id, position) do nothing;
