# Novex cross-platform and authentication plan

Repository inspected before edits: Electron main/preload, launcher, installer (Vanilla/Fabric/Quilt/Forge/NeoForge), Modrinth, instance/file managers, React pages/services/types, SQL schema, build configuration and assets. No readable Git history in this workspace. Original source snapshot: /tmp/novex-before-cross-platform.tgz.

1. Preserve existing storage name and instance paths; add configurable storage and Java selection. Fix platform rules, missing native extraction, classpath/JVM placeholders, and process lifecycle. Harden filesystem and IPC boundaries.
2. Add main-process Microsoft authorization code with S256 PKCE, own registered custom URI, system browser, Xbox/XSTS/Minecraft exchanges, ownership/profile verification, encrypted refresh-token storage, account CRUD and refresh. No client secret. Explicit local accounts remain separate from social accounts.
3. Add Minecraft account controls and activate the existing Settings component. Remove renderer-supplied credentials from launch. Preserve existing content and social pages.
4. Add Windows NSIS/Linux AppImage/RPM/DEB metadata and tag release CI, tests, and operational/security documentation.

Run real TypeScript project checks (`tsc -b`, since the original `tsc` command only sees an empty root project), frontend builds, and targeted Node regression tests after stages. Run packaged/dev startup if the environment supports it. Live account approval, Windows runtime and distribution-specific checks require external validation; do not claim these as tested.

## Continued scope (2026-09-16)
Git is now available: clean main at a5b7d65, origin points to the existing Novex-Client repository. Preserve this baseline. Use @azure/msal-node PublicClientApplication with the supplied common authority. Add monitored background lifecycle and tray, explicit leave-game-running quit, legal drafts and versioned first-run acknowledgement, accurate generated dependency notices. Validate before a single normal commit/push; never merge/rebase/force on push failure.

## Callback recovery and Home scope (2026-09-16)
1. Investigate packaged callback before adding features. Fedora has no registered scheme handler; create and verify a per-user desktop handler before login, targeting the persistent AppImage path. Keep existing Entra URI and PKCE/state. Guard secondary-instance startup and add credential-free stage diagnostics. Test packaged callback routing; live Microsoft interaction remains a manual test.
2. Add validated remote Home hero content with local fallback, Realtime reconciliation and polling; secure server-owned admin role, RLS and Home editor.
3. Add separate trusted GitHub release checks/download links, retain all existing storage paths, expose storage locations.
4. Validate builds, packages, data preservation and security. Review everything before one normal commit/push.


## Resume and authorized history reconciliation (2026-09-17)
Remote 37677c7 and local a5b7d65 have independent histories. User authorized safe reconciliation after the initial stop. Retain remote MIT LICENSE and README, preserve the newer local launcher/security implementation, omit generated dist files, and finish with a single merge commit that includes both histories. Backup source tar, history bundle and original stash remain available locally.

CurseForge research confirms mandatory API/CDN credentials and restricted key sharing. Ship only an honest optional-source setup state plus the operator architecture guide; live browsing/installing requires approved access and a secure backend. Do not fake readiness. Reuse NovexSelect, improve keyboard/focus behavior and dark controls, and preserve existing content pages and favorites. Rebuild and run focused UI/Modrinth regression tests after these additions.
