# Local launcher utilities

This batch extends the existing renderer catalog, path registry, main-process file APIs,
Java discovery, and Modrinth installer. Java version parsing now ignores the VM name “OpenJDK 64-Bit” instead of treating 64 as a Java major version. Existing accounts, storage locations and Home/Supabase systems are unchanged.

## Available

- Instances: clone into a new UUID directory, favorite, sort by name/favorites/creation/last successful launch. Existing custom icons remain supported; new uploads are limited to 256 KiB PNG/JPEG/WebP.
- Instance Editor → Utilities: notes, simple group labels, basic installation/Java health, manual crash hints, Modrinth updates.
- Required dependency names are shown before installing a Modrinth mod; the existing main-process installer validates and installs required dependencies only.
- Mod updates use exact SHA-1 identity via [Modrinth's documented hash lookup](https://docs.modrinth.com/api/operations/versionsfromhashes/). They never infer project IDs from filenames. Checks send hashes to Modrinth, not files. Unknown files remain unavailable.
- Updates require matching Minecraft and loader metadata, no duplicate project, satisfied known required dependencies, and no installed exact-version dependent. Downloads are hash-verified before the original moves into `.novex-mod-backups`. Failed downloads leave the original untouched. Required dependency changes stop the update; rerun the check. Update All stops at the first failure.
- Instance Editor → Worlds: names, folder dates, approximate sizes, open, manual backup. Backups are timestamp/UUID directories under Electron userData `world-backups/<instance-id>`, each containing `world/` and `backup.json`. Source files are never overwritten. Stop Minecraft first. Copy operations reject symlinks and preserve empty directories.
- Instance Editor → Screenshots: 20 thumbnails per page, Open in system viewer, Copy Path, Open Folder, confirmed deletion.
- Settings → Launcher utilities: discovered Java installations and global selection, local personal server add/edit/remove/copy, approximate storage usage and fixed Open Folder actions. Server records use `personal-servers.json` in userData; no connection occurs.
- Filesystem traversal runs asynchronously in Electron main, on demand, with a 100,000-entry limit. Size scans skip symbolic links. File mutation, installation and launch IPC are blocked while utilities run; utility mutations are blocked during Minecraft.

## Partial / deliberately deferred

- Health checks validate key files and Java; exact-hash mod compatibility/dependency/duplicate warnings are in **Check Mod Updates**. No offline JAR manifest parsing, memory tuning or full dependency solver. Existing memory maximum is 4 GiB.
- Crash hints are manual and conservative (memory, Java, dependency, compatibility, Mixin); use full logs for details. No automatic crash popup or claimed identification of a culprit.
- Java choice is launcher-wide. Per-instance override and managed Java downloads are deferred.
- Worlds: backups are folders, not ZIPs; restore UI, automatic backups and retention are deferred. No backup is automatically deleted.
- Groups are labels, not nested folders; custom server icons are deferred.
- CurseForge checking stays unavailable with the existing optional provider setup. Existing Modrinth browsing/installing remains default.
- Unified download activity, instance archive import/export and other-launcher detection/import are deferred.
- Storage totals overlap; cache and application-data totals can contain instance data. There is no cache deletion action.

## Validation

Unit tests cover isolated copies, no-overwrite, symlink rejection, failure cleanup and non-leaking crash hints. Existing auth, RLS, platform, updater, path and process tests are retained. Isolated Electron fixture checks exercise utilities without real worlds/accounts; downloaded update bytes are mocked for integrity failure and success.

Manual release checks: Windows filesystem/Java/UI; real large instance clone (especially Forge/NeoForge generated arguments); real Java detection and Minecraft launch; real Modrinth updates/dependency chains; large world backup and screenshot collections. There is no authenticated Microsoft or real game launch in the utility smoke test.
