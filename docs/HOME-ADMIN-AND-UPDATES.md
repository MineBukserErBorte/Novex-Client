# Home content, admin setup and releases

## Apply the database migration

Run the entire file `supabase/migrations/20260916201532_novex_home_content.sql` once in your existing project's Supabase Dashboard → SQL Editor, using the database operator account. It is transactional and additive. Do not rerun the old `supabase_schema.sql` or reset your database. Existing social profiles/friends/chat are unchanged.

Added objects:
- `public.home_slides`: constrained slide fields, dates and order; RLS enabled.
- `novex_private.home_admins`: server-owned admin membership, no client table privileges or write policies.
- `public.novex_is_admin()`: returns only the current signed-in user's status; no user ID argument.
- `public.home_content_revision`: public read-only revision counter, bumped by a protected trigger.
- Private role-check/timestamp/revision functions with fixed search paths and restricted execution privileges.

Public SELECT permits only enabled slides within their schedule. Authenticated admins can SELECT all and INSERT/UPDATE/DELETE. UPDATE has both USING and WITH CHECK. A normal user cannot promote themselves through their profile, JWT user metadata, renderer or REST writes. Do not expose `novex_private` in Supabase Data API settings.

## Safely promote your existing account

1. Sign into the Supabase Dashboard as the project owner. Open Authentication → Users. Find your existing Novex account and copy its **User UID**, checking the email yourself.
2. In SQL Editor, replace the placeholder below with that exact UUID and run:

```sql
insert into novex_private.home_admins (user_id)
values ('YOUR-EXISTING-AUTH-USER-UUID'::uuid)
on conflict (user_id) do nothing;
```

3. Sign into that Novex social account. The Admin section appears after the next role check (up to 45 seconds), or restart Novex. Minecraft sign-in is unrelated.
4. To revoke admin rights, run as the project operator:

```sql
delete from novex_private.home_admins
where user_id = 'YOUR-EXISTING-AUTH-USER-UUID'::uuid;
```

Database write rights stop immediately. The UI refreshes periodically; it is not the security boundary. Do not create any frontend role-setting API or embed an operator/service-role key.

## Home and Realtime

Home retains the original local welcome/library panel and all sections below the hero. Remote slides rotate after seven seconds; hover, keyboard focus, explicit Pause and hidden windows pause rotation. Previous/next/dots work independently. Reduced-motion preferences disable the animation.

Remote rows are bounded, validated text, types, dates and HTTPS links. Malformed rows are skipped. Images use no-referrer; unavailable images have a local visual fallback. Ads say **Sponsored**. Partner servers display an address with **Copy IP** and an optional HTTPS website; they never connect Minecraft automatically. Button links open in the system browser through validated main-process IPC.

The migration adds `home_slides` and `home_content_revision` to the existing `supabase_realtime` publication. If the publication does not exist (self-hosted/test setup), enable replication for both tables manually in Supabase Publications before testing. The client subscribes to all slide changes and revision updates, debounces notifications, and re-fetches authorized records. Revision updates cover disabling rows hidden by RLS without leaking drafts. A 45-second fetch also handles missed events, reconnection and scheduled starts; expiry of loaded rows is checked locally every second. Subscriptions/timers are removed on unmount. Unavailable services show the original welcome panel; no local instances are affected.

Admin → Home Content supports creation, edit, deletion, enabled toggle, type, all presentation fields, start/end and numeric sort order. Lower numbers come first; ties sort by UUID. Preview does not publish. New slides start disabled. Currently lists at most 200 records; keep active editorial content within this limit.

## Trusted releases and updates

The main process reads `app.getVersion()` and the public GitHub releases endpoint for **MineBukserErBorte/Novex-Client**. It accepts only non-draft, non-prerelease `vMAJOR.MINOR.PATCH` releases with the expected GitHub page and installer URLs. `semver` compares versions. Renderer data and Home slides cannot change the source.

Home checks when opened; Settings provides Check for Updates. Checks are coalesced/cached for one minute. A newer release with an appropriate platform asset shows Download Update. This opens the fixed release page: **Novex does not automatically download, verify or execute installers**. Verify the downloaded installer against the release's SHA256SUMS.txt yourself (PowerShell `Get-FileHash -Algorithm SHA256`, Linux `sha256sum`). Checksums detect corruption; unsigned checksums are not publisher signatures. Signing remains configurable with real `CSC_LINK`/`CSC_KEY_PASSWORD` GitHub Secrets. No fake certificates exist.

- Windows: download/run the new NSIS installer, normally per-user.
- Linux AppImage: download the new AppImage into a stable writable location, make it executable and run it. Sign-in refreshes the desktop handler to the current AppImage path.
- Linux DEB/RPM: download the matching package and upgrade through your distribution's package manager. System package installation may require administrator authentication; normal use does not.
- Download failures never mutate installed binaries or user data. There is no destructive cleanup, automatic binary swap or pretend rollback.

The release workflow builds only on explicit tags or manual dispatch. Tags create a **draft** release with all four installer formats and SHA256SUMS.txt after both jobs pass. Review and publish the draft to expose it to clients. A manual dispatch produces artifacts without a production release. Set public build variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable/anon key only) in GitHub repository Variables.

If the repository is private, its API/releases are not public: clients show that no public release is available, and receive no token. Before public distribution, make this release repository public or create a dedicated public release repository, change the source-controlled `RELEASE_REPOSITORY` constant and release workflow destination together, and rebuild. Do not solve private downloads by shipping a GitHub token.

## Existing data

The package's existing `name` and Electron userData location are retained across versions. Instances retain the registered original path; custom storage remains in launcher-settings.json. No directory migration is performed. New storage selections affect newly created instances only; existing instances are never moved. Settings displays the selected new-instance root, userData and Chromium cache path. Minecraft libraries/assets/versions/downloads remain inside each instance; there is no shared download cache to relocate.

Account metadata and encrypted MSAL/Supabase caches, social session, localStorage instance catalog, worlds/mods/config/resourcepacks/shaderpacks/screenshots and logs are outside application binaries. Replacing the package does not delete them. Back up user data separately as usual.

## Manual deployment tests

After applying SQL, use two running Novex clients: publish/edit/disable/delete a slide and verify the second updates promptly. Disconnect/reconnect its network and verify reconciliation. Test a scheduled start/end and an invalid image. Use a non-admin account and attempt writes directly through Supabase's API: INSERT must fail, UPDATE/DELETE must affect no rows; role table access must fail. Verify admin revocation.

Live Supabase deployment, real Realtime transport and public production release downloads must be checked against your configured backend/repository. Local PostgreSQL regression tests validate SQL authorization, not those hosted services.
