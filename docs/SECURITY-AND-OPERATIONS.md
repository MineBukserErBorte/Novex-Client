# Novex implementation and operator checklist

## Architecture

One Electron/React codebase targets Windows 10/11 x64 and Linux x86_64. Existing application name and user-data paths are retained to avoid orphaning user data. Instance path mappings retain existing folders when names/default storage change. Settings selects Java using a native executable picker and storage using a native directory picker. Java discovery checks JAVA_HOME/JDK_HOME, PATH and common Windows/Linux installations and requires the profile's Java major version.

The original launcher, installer, Modrinth browser, file manager, console, friends/chat and social account services remain. The existing Settings component replaces the old Settings placeholder. Resource-pack and loader paths remain available.

### Microsoft accounts

`@azure/msal-node` PublicClientApplication uses Novex's public client ID `4df8fc45-5d5d-4d5d-ad5e-c98203479c15`, common authority, S256 PKCE and a random, single-use state. The system browser returns to `msal4df8fc45-5d5d-4d5d-ad5e-c98203479c15://auth`. The main process checks the URI and state and exchanges the code. MSAL manages access/refresh credentials through an encrypted cache plugin. No client secret or borrowed application registration exists.

The main process performs Xbox Live → XSTS (RETAIL/Minecraft relying party) → Minecraft Services → Java entitlement → profile validation. Every authenticated launch rechecks the account; failure never falls back to local mode. A Minecraft Services login HTTP 403 is reported as Novex application authorization rejection. This status is not proof of the exact server-side approval reason; the stage/status is logged for operator follow-up. Other failures remain separate.

Account IPC returns username, UUID, skin URL, type, safe authentication status and selection only. Minecraft launch credentials and MSAL cache remain outside React. Local accounts use an explicit offline UUID and no authenticated token; they cannot authenticate to online-mode servers. Removing a selected account clears selection.

Electron safeStorage uses the OS encryption/keyring backend. Linux `basic_text` and `unknown` are refused for persistence. Without a secure backend, new credentials are session-only. Existing encrypted caches require the keyring to unlock. Supabase's existing renderer client still needs its own session at runtime; its persistent cache is encrypted via separate, fixed-purpose IPC. It is not the Minecraft token store.

### Process lifecycle

A standalone `gameSupervisor.cjs` starts Java in a separate process group and owns/drains its pipes. It forwards redacted complete lines over private IPC while Novex is open. On explicit quit it continues draining output until Java exits; this avoids broken output pipes. No raw command preview is logged. Java's native command-line authentication arguments can still be visible to another program running as the same OS user; this is a game interface constraint.

Closing without a game exits normally. Closing with a game defaults to hiding the window, with tray controls and a once-per-session optional notification. Linux desktops without tray integration can reopen the existing process by launching Novex again. Stop targets the supervised Java process group on Linux or taskkill's process tree on Windows. When a hidden game's process exits, Novex exits. Explicit Quit asks before leaving the game running. The background setting can explicitly choose leave-game-running exit on window close.

The monitor depends on Electron's RUN_AS_NODE capability. Do not disable the RunAsNode fuse in a future packaging/signing change without replacing this monitor with an independently bundled runtime and retesting survival/Stop/logging.

## Security findings and fixes

- Original main renderer sandbox disabled: enabled using a CommonJS sandbox-compatible preload, keeping contextIsolation and nodeIntegration settings secure.
- Original IPC trusted arbitrary renderer callers and arbitrary installation directories: sender/frame/origin checks, validated registered instance directories, constrained launch fields and account IDs added.
- Existing lexical path checks allowed symlink escapes: managed paths reject symlinks/junctions, traversal, root deletion and invalid names. These checks do not provide race-proof isolation against a malicious local process changing the filesystem concurrently.
- Original Java identity was a fixed offline username/token: replaced with explicit selected local or verified Microsoft identity.
- Unverified Modrinth files: hashes checked before writes; protected launcher paths excluded from modpack overrides. Minecraft metadata, client/assets/libraries and native downloads use available hashes. HTTPS and redirect limits enforced. A checksum from the same provider verifies integrity, not independent trust in that provider.
- Installer already executes third-party loader jars and Minecraft mods are executable code. These features remain; users must trust the sources they install. Novex does not sandbox Java mods.
- Authentication logs use allowlisted diagnostic fields; complete console lines redact the Minecraft launch token. Game/mod-owned logs are outside Novex's complete control.
- Supabase service role/private keys are rejected from Vite-exposed configuration. Only public URL and publishable/anon key belong in VITE variables.
- No source-integrated analytics, crash-upload or billing system was found. This change adds explicit GitHub release checks and a download link, with no automatic execution. Third-party libraries/services can have their own behavior.
- Dependency audit advisories found during installation were patched with compatible updates. See validation report for final audit status.

## Operator actions before distribution

1. **Microsoft Entra:** retain public-client configuration, client ID and exact redirect. No secret is needed. Verify consent to XboxLive.signin/offline_access and test a personal Microsoft account that owns Java. Organization accounts may fail Xbox eligibility even though the Entra app supports them.
2. **Minecraft Services:** approval/allowlisting of this application's ID has not been verified. If the service rejects it, contact Minecraft's application approval/support process. Do not replace the client ID with another launcher's ID.
3. **Linux browser callback:** DEB/RPM install desktop protocol metadata. Before interactive sign-in, Novex writes a per-user novex-auth.desktop entry and verifies the xdg-mime association. AppImage uses the persistent APPIMAGE executable path, never its temporary mount. Development uses the Electron executable plus project path. No alternate redirect or manual token entry is added. Use a desktop with Secret Service or KWallet unlocked for persistent authentication.
4. **Supabase:** configure the public build-time URL/key. Inspect the deployed RLS, function grants, schema and retention rules. The Home/admin migration is provided and tested locally, but was not applied to the live project. No live backend policy changes were made. Define account-deletion/support procedures; there is no self-service server-account deletion in this source.
5. **Legal:** complete operator identity, contact, jurisdiction/legal bases, hosting/transfers, retention, minors and moderation procedures. Review all initial drafts professionally as appropriate. The remote repository’s MIT LICENSE is preserved; dependency notices are separate.
6. **SignPath/signing:** confirm repository ownership, product/license identity, reviewed legal contact and reproducible CI artifacts. Obtain actual SignPath credentials/certificate policy separately and store private values as GitHub Secrets. Real CSC_LINK/CSC_KEY_PASSWORD secrets can configure electron-builder signing; no fake certificate is present. Explicit tag builds prepare a draft release for review.

## Build and CI

Use Node 22 or newer and npm. Run `npm ci` on each target OS; do not copy `node_modules` between Windows and Linux.

```
npm ci
npm run check:electron
npm test
npm run build
npm run dev
```

Windows: `npm run dist:win` (NSIS x64).
Linux: `npm run dist:linux` (AppImage, RPM, DEB x64).
On Fedora build hosts, electron-builder’s FPM helper needs `libxcrypt-compat` (`libcrypt.so.1`) and RPM build tools; these are packaging prerequisites, not Novex runtime requirements.

Artifacts go under `release/` and are ignored by Git. DEB/RPM installation may need the distribution's package-manager privileges; an AppImage can run from a user-owned directory. Normal Novex operation and instance storage do not require root. AppImage execution can require distro FUSE support; extracted AppImages are an alternative.

CI validates on Windows/Linux pushes and pull requests. Tag `v0.2.0` builds packages using that version and prepares a draft GitHub release with checksums. The operator must review and publish it before clients can see an update. No release tag is created by this task. Public Supabase configuration can be supplied through CI repository variables/environment as needed; credentials are not embedded in workflow YAML.

Sources: [Microsoft PKCE flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [MSAL Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node), [Xbox service authentication](https://learn.microsoft.com/en-us/gaming/gdk/docs/services/fundamentals/s2s-auth-calls/service-authentication/live-website-authentication), [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage), [Minecraft usage guidelines](https://www.minecraft.net/en-us/usage-guidelines).


## Packaged callback investigation

On the inspected Fedora host, `xdg-mime query default x-scheme-handler/msal4df8fc45-5d5d-4d5d-ad5e-c98203479c15` returned no handler and the per-user applications directory did not exist. The old code called setAsDefaultProtocolClient without verifying a Linux desktop entry. This is a demonstrated missing return route for a bare AppImage; the exact Microsoft browser screen cannot by itself prove which browser prompt/policy also affected the reported attempt.

The fix registers/verifies a per-user desktop handler immediately before login, supports stable AppImage paths, prevents a secondary process from creating a competing main window, and records credential-free stages in userData/logs/novex.log. No Entra change is required: retain the existing custom URI. A packaged executable test dispatched a synthetic cancellation callback through gio, crossed the second-instance boundary, validated the current state, rejected/cancelled correctly and created no account. This is not a live Microsoft or Minecraft success test.

A localhost alternative was evaluated against Microsoft's desktop guidance. It would require adding exact `http://localhost` under Entra App registrations → Novex Client → Authentication → Add a platform → Mobile and desktop applications → Custom redirect URIs → Configure/Save (or edit the existing desktop platform). It is not enabled or assumed configured here because the registered custom callback now routes in the packaged test. Never add it as a Web/confidential client or create a secret.

MANUAL TEST REQUIRED: start the rebuilt AppImage or installed RPM, open Settings → Minecraft account → Sign in with Microsoft, finish sign-in and approve the browser's Open Novex prompt. Check that the UI progresses through Microsoft, Xbox Live, XSTS, Minecraft Services, ownership and profile. If it stops, inspect only the stage/status records in novex.log; never share tokens/callback URLs. Confirm username/UUID/skin, restart, refresh and launch a real instance with an owned account; then test online-mode multiplayer. Verify cancellation, accounts without Java, expired credentials and an unavailable keyring. Minecraft Services HTTP 403 is handled as application authorization rejection; only a live response can establish Novex's approval status. Windows and other Linux distributions require their own runtime checks.

See HOME-ADMIN-AND-UPDATES.md for the additive SQL migration, safe admin promotion, Realtime, releases and data preservation.
