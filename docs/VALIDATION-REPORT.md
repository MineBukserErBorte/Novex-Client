# Continuation and validation report — 2026-09-17

## Where work resumed

The previous session left substantial uncommitted authentication, Home/admin, lifecycle, security and packaging work. It had not finished validation or pushed a completed change. This continuation inspected and retained that implementation, finished callback registration and content-download validation, added the optional content-source UI and polished existing dark controls.

Local history (`a5b7d65`) and GitHub history (`37677c7`) were independent. After reporting this and receiving permission to continue, both histories were reconciled with a merge. GitHub's README and MIT LICENSE were retained; generated remote `dist` files were excluded from source control. Backups and the pre-reconciliation stash were retained. No instance/user-data directories were reset or moved.

## Implementation status

- One Windows/Linux codebase: platform Java detection, native libraries, classpaths, safe paths, configurable new-instance storage and process-tree stopping. Existing manually selected Java and registered instance paths remain supported.
- Main-process MSAL authorization code + S256 PKCE using only Novex's public application ID; Microsoft → Xbox Live → XSTS → Minecraft Services → entitlement/profile. Encrypted OS-backed caches where available, session-only fallback otherwise. Separate Supabase social account and explicit Offline / Local Account.
- Linux per-user desktop callback registration, stable AppImage path and second-instance forwarding. No Entra redirect change or client secret required.
- Authenticated launch takes verified username, UUID and token from main. No automatic offline fallback. Minimal validated preload IPC; sandbox and context isolation enabled.
- Home carousel, sponsored/partner slides, server-enforced admin controls, additive Supabase SQL and Realtime reconciliation. Existing Home sections and social features retained.
- Trusted GitHub update checks and explicit release-page downloads. **Automatic installer download/apply is not implemented.** The repository is currently private, so a public release channel is required before public update checks can succeed.
- Shared dark dropdowns, consistent control states/spacing, account wrapping and source selectors. Modrinth remains the default.
- **CurseForge browsing/installation is not enabled.** The selector explains setup requirements. Current credential/distribution requirements need an approved server integration, not an embedded desktop API key. See [operator setup](CURSEFORGE-SETUP.md).
- NSIS, AppImage, RPM and DEB configuration; tag-triggered draft releases and checksums; optional real signing credentials.

## TESTED

On this Fedora x86_64 host:

| Check | Result |
| --- | --- |
| TypeScript `npm run typecheck` | Passed |
| Electron syntax `npm run check:electron` | Passed |
| Production `npm run build` | Passed; nonfatal Vite large-chunk warning |
| `npm test` | 19/19 passed |
| Dependency audit during lockfile update | Zero reported vulnerabilities at that check |
| Electron packaged directory | Built successfully |
| Linux AppImage, RPM, DEB | All built successfully |
| Git whitespace/conflict review | Passed before staging |

Automated regression coverage includes PKCE/state/cancellation, fixture-based Minecraft authentication and failure stages, ownership/profile validation, Modrinth exact-file compatibility, path/symlink/native/hash checks, process supervision/redaction, trusted semantic-version updates, slide validation and real PostgreSQL RLS behavior through PGlite.

Packaged Electron smoke checks used isolated `/tmp` profiles and synthetic accounts/network responses where needed:

- Real MSAL authorization URL creation and synthetic cancellation returned through `gio open` and the secondary process, with state validation and no fake account or state in diagnostic logs. Passed for the unpacked package **and final AppImage in normal mode**. This exercises desktop routing, not Microsoft account authentication.
- An additional AppImage `APPIMAGE_EXTRACT_AND_RUN=1` test failed browser-style dispatch; direct secondary invocation in that mode passed. Browser callback in that special mode is not validated. Normal AppImage mode passed.
- Modrinth search and actual renderer → IPC → main → verified fixture JAR installation passed. Wrong Minecraft version and corrupted hashes were rejected. Source switching preserved Modrinth behavior; CurseForge made no upstream request.
- Dark Settings controls and keyboard dropdown interaction inspected; no renderer errors in that smoke test.
- Restart preserved fixture instance paths, custom new-instance storage, local account/catalog, and byte-for-byte worlds/mods/config/resourcepacks/shaderpacks/screenshots.
- Home rotation/navigation/sponsored and partner content, Admin CRUD/order/preview, unavailable-backend fallback and normal-user Admin hiding passed with fixture backend responses.
- Game lifecycle smoke used a Java-process simulator: hide/reopen, Stop and exit behavior passed. This was not a real Minecraft game.

Linux packaging used temporary extracted Fedora build helpers (`libxcrypt-compat`, RPM tools) without installing them into the system. The final RPM/DEB builds used gzip compression overrides; repository build defaults remain unchanged. Artifacts are in `release/` and are not committed. The existing Windows installer in that directory was **not** built or validated by this continuation.

## MANUAL TEST REQUIRED / NOT TESTED

1. **Live Microsoft/Minecraft:** complete browser sign-in with an owned Java account; verify profile/skin, persistence, refresh, switch/remove and actual game/online-mode launch. Test cancellation, no ownership, missing profile and expired credentials. Novex's Minecraft Services allowlist status is unknown; a rejection is handled clearly, never bypassed.
2. **Windows:** install/upgrade NSIS on Windows 10/11, callback association, Java discovery/launch/Stop, tray and encrypted persistence. Windows packaging/runtime was not executed here.
3. **Linux distributions:** installed RPM/DEB upgrade/runtime, Ubuntu/Mint/Arch, Java versions/loaders, native rendering, file operations and locked/unavailable keyrings. Built packages were not system-installed.
4. **Supabase deployment:** apply the additive migration, promote the intended existing account through operator SQL, and test two-client Realtime, revocation and existing friends/chat against the live backend. No live SQL or admin role was changed by this work.
5. **Content regression:** real large modpacks, all supported loaders, dependencies, network interruption and existing favorites across actual user libraries. Fixture Modrinth tests passed; they do not establish every live API/install path.
6. **Releases:** configure public Supabase build variables, run hosted Windows/Linux workflows, publish a reviewed release and test update downloads. No release tag or release was created. Private-repository public update access is unavailable until configured.
7. **CurseForge:** approval, backend and live implementation remain external prerequisites; no live API or installation test was performed.
8. Complete legal/operator details and configure real signing credentials if desired. No fake signing certificate was added.

## Security findings addressed

Validated IPC callers and registered instance paths; enabled the renderer sandbox; kept Minecraft credentials in main; encrypted credential persistence; redacted launch-token output; rejected traversal/symlink escapes; wired Modrinth hash verification into actual downloads and checked selected-file compatibility; prevented admin self-promotion through server RLS; rejected service-role keys in public build configuration. No shared CurseForge key, Microsoft secret or GitHub token is embedded. Mods/loader installers remain executable third-party code by design. See [security details and limits](SECURITY-AND-OPERATIONS.md).

## Main files changed

- Electron: `main.js`, `preload.cjs` (replaces `preload.js`), accounts/auth/protocol/secure-store/diagnostics modules, launcher/installer/instance/settings/path/content modules, process supervisor/lifecycle and update modules.
- Frontend: App routing, Home/Settings/Admin/Legal and existing content pages; account/settings/carousel/source/update/legal components; shared dropdown and CSS; safe frontend types/services/hooks.
- Backend: `supabase/migrations/20260916201532_novex_home_content.sql`.
- Build: `package.json`, lockfile, Vite/HTML configuration, scripts, `.github/workflows`, `.gitignore`.
- Verification/documentation: `tests/`, `docs/`, retained remote README/LICENSE and legal drafts.

The commit's file list is authoritative (`git show --stat`). Generated packages, auth caches and local environment files are excluded.

## Build commands

Use Node 22+ on each target OS; install dependencies there rather than copying `node_modules` between platforms.

```sh
npm ci
npm run check:electron
npm test
npm run build
```

Windows x64 NSIS:

```sh
npm run dist:win
```

Linux x86_64 AppImage/RPM/DEB:

```sh
npm run dist:linux
```

Fedora build hosts need RPM build tools and `libxcrypt-compat` for electron-builder's packaging helper. Ordinary launcher use does not require root. AppImage needs working distro FUSE support in normal mode. See [Home/admin/release setup](HOME-ADMIN-AND-UPDATES.md) for deployment steps.

## Microsoft invalid_scope follow-up

The user's credential-free diagnostics showed successful callback delivery and authorization-code receipt, followed by `invalid_scope` during token exchange. This was a Microsoft OAuth rejection before Xbox/XSTS/Minecraft, not evidence of missing Minecraft ownership or allowlisting.

Changed the MSAL authority from `common` to `consumers`, matching the personal-account endpoints in [Microsoft's Xbox authentication documentation](https://learn.microsoft.com/en-us/gaming/gdk/docs/services/fundamentals/s2s-auth-calls/service-authentication/live-website-authentication). Kept Novex's client ID, public-client PKCE flow, registered redirect and encrypted cache. The registration can still support both account types; Minecraft sign-in requests a personal Xbox-capable account. Scope rejection now has a specific message rather than suggesting the account is organizational.

Added a regression through the actual MSAL library with a fake token response, verifying both endpoint URLs, S256, verifier, client ID, redirect, Xbox scope and absence of a client secret. A real sign-in must still be retried in the rebuilt application to confirm Microsoft accepts the request; this test does not establish live success.
