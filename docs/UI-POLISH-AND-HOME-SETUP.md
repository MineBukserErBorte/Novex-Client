# UI polish and Home setup

## Why the carousel was missing

The existing `src/components/HomeCarousel.tsx` was rendered by `src/pages/Home.tsx`, but hid its controls when only the welcome slide was available. A read-only inspection of the configured **Novex Client** Supabase project confirmed that `public.home_slides` and `novex_private.home_admins` did not exist, no role columns/tables were found in `public`, and no tables were in `supabase_realtime`. The previous migration had been provided but not deployed.

Home now always has the local welcome hero. When remote content is absent or unavailable it rotates through two additional local Novex tips. These are not invented advertisements or partner servers. Published remote slides replace those tips, while welcome stays first. Only the hero moves; the library remains still. Arrows, dots, pause, seven-second rotation, timer reset, focus/hover pause and reduced-motion support remain. Long remote content scrolls inside a consistent-height panel instead of moving the rest of Home.

## Database setup — run once in Supabase Dashboard → SQL Editor

Run the **entire existing migration**:

[`supabase/migrations/20260916201532_novex_home_content.sql`](../supabase/migrations/20260916201532_novex_home_content.sql)

This is the exact executable migration, not a schema example. Do not run `supabase_schema.sql`, reset the project or create another role system. The migration adds only Home objects and grants. It intentionally creates no sample sponsored content and promotes no account. If you already ran it after this inspection, do not run it again: verify the objects instead.

### 1. Find your account

Run as the database operator in SQL Editor (never inside Novex):

```sql
select id, email, created_at
from auth.users
order by created_at;
```

Identify your own existing Novex social account by email and copy its exact `id`. This is unrelated to the Minecraft username/UUID. Do not share the resulting account list publicly.

### 2. Promote that exact account

Replace **both** placeholders after checking the row above. The email is a second check; the role is assigned by the Auth UUID. A mismatch changes nothing.

```sql
insert into novex_private.home_admins (user_id)
select id
from auth.users
where id = 'YOUR-EXISTING-AUTH-USER-UUID'::uuid
  and lower(email) = lower('YOUR-EXACT-ACCOUNT-EMAIL')
on conflict (user_id) do nothing;
```

### 3. Verify email, user ID and role

```sql
select u.email, u.id as user_id,
       case when a.user_id is not null then 'admin' else 'user' end as role
from auth.users u
left join novex_private.home_admins a on a.user_id = u.id
where u.id = 'YOUR-EXISTING-AUTH-USER-UUID'::uuid;
```

The result must say `admin`. Sign into that Novex social account through Friends. Admin → Home Content appears after the role refresh (up to 45 seconds) or restarting Novex. New slides start disabled: enter content, enable, then Save. Use sort order to arrange them; lower values appear first. The server name is the slide Title, banner is Image URL, description is Description, and website is Button URL. Partner slides expose Copy IP without auto-connecting.

## RLS and Realtime

- `public.home_slides`: public SELECT sees only enabled, currently scheduled slides. Admin SELECT sees drafts too. Admin INSERT/UPDATE/DELETE use the private role predicate; UPDATE checks both existing and new row authorization.
- `novex_private.home_admins`: RLS enabled, no client table privileges or promotion policies. Only the database operator changes membership. No role comes from localStorage, React, email comparison or editable user metadata.
- `public.novex_is_admin()`: authenticated-user RPC reports only the caller's membership.
- `public.home_content_revision`: public read-only counter signals changes even when disabling a row hides it under RLS. It exposes no draft content.
- The migration adds slides and revision to `supabase_realtime` when that publication exists. Novex subscribes to both, debounces re-fetching and falls back to a 45-second refresh; it does not poll Home every five seconds.

Verify after migration:

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename in ('home_slides', 'home_content_revision', 'home_admins');

select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename in ('home_slides', 'home_content_revision');
```

In Dashboard, check Data API is enabled and `public` is exposed. The migration already grants the required table access. **Do not expose `novex_private`.** Under Publications, enable `home_slides` and `home_content_revision` for `supabase_realtime` if either is absent. [Supabase's Postgres Changes guide](https://supabase.com/docs/guides/realtime/postgres-changes) describes publication setup. Ensure the packaged build has the existing public Supabase URL and anon/publishable key; never a service-role key.

The live database was inspected only. This UI task does not deploy SQL or promote an unidentified account. After deployment, test edit/disable/delete with two clients and verify schedule boundaries and admin revocation.

## Scope and validation

Shared compact controls, typography, spacing, cards, scrollbars, responsive layouts, source/provider labels, account actions and accessible dark dialogs were polished. Existing authentication, installer, storage, tray, updater and social service contracts remain unchanged. CurseForge retains its existing setup-required state.

Automated and visual results are recorded below. Hosted Realtime and actual admin-account promotion require the operator steps above.

### Validation results (2026-09-18)

- **TESTED:** TypeScript, Electron syntax and production build passed. All 20 regression tests passed outside the restricted child-process sandbox (the sandbox-only supervisor run failed; the desktop-capable rerun passed). RLS tests use PGlite PostgreSQL and verify admin CRUD, normal-user write/promotion denial, signed-out public-only reads, schedules and revocation.
- **TESTED:** Real Electron with isolated temporary data and fixture content: local seven-second rotation, remote Sponsored/Partner Server display, constant hero height with long content, arrows/dots, dropdown search and selected-option focus, confirmation cancellation, Admin create/edit/delete, and no renderer exceptions. No real account or user instance was modified.
- **VISUALLY INSPECTED:** Home, Instances, instance creation, Mods, Modpacks, Files, Versions, signed-out Friends/login and Chat, Minecraft accounts/Settings, Resource Packs, Shader Packs, Config, instance settings, Admin and confirmation dialog screenshots. Wide 1200×750 and narrow 760×700 layouts were exercised; main content overflow assertions passed. Navigation now resets the page scroll position, and collapsed sidebar buttons retain accessible names/tooltips.
- **NOT TESTED LIVE:** Signed-in friends/chat, real Microsoft authentication/game launch in this visual pass, real two-client hosted Realtime, production update availability, Windows runtime and OS-native tray/quit dialogs. These backend/lifecycle implementations were not changed.
- No database schema was changed or applied. The Supabase inspection was read-only. Normal-user security is tested in SQL; the Admin UI fixture deliberately supplies a test admin response and is not evidence of hosted authorization.
- Shader/config controls previously had no handlers; they now navigate to the corresponding existing instance file-manager directory. Shader importing remains manual; this is not a new content provider or installer.
- **BUILT:** Electron Linux package directory and `release/Novex-Client-0.1.0-linux-x86_64.AppImage` completed successfully after retrying an interrupted packaging process. RPM/DEB and Windows installers were not rebuilt in this UI pass; existing files for those formats may contain the previous build.
