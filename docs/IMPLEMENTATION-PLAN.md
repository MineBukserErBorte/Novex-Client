# Novex cross-platform and authentication plan

Repository inspected before edits: Electron main/preload, launcher, installer (Vanilla/Fabric/Quilt/Forge/NeoForge), Modrinth, instance/file managers, React pages/services/types, SQL schema, build configuration and assets. No readable Git history in this workspace. Original source snapshot: /tmp/novex-before-cross-platform.tgz.

1. Preserve existing storage name and instance paths; add configurable storage and Java selection. Fix platform rules, missing native extraction, classpath/JVM placeholders, and process lifecycle. Harden filesystem and IPC boundaries.
2. Add main-process Microsoft authorization code with S256 PKCE, own registered custom URI, system browser, Xbox/XSTS/Minecraft exchanges, ownership/profile verification, encrypted refresh-token storage, account CRUD and refresh. No client secret. Explicit local accounts remain separate from social accounts.
3. Add Minecraft account controls and activate the existing Settings component. Remove renderer-supplied credentials from launch. Preserve existing content and social pages.
4. Add Windows NSIS/Linux AppImage/RPM/DEB metadata and tag release CI, tests, and operational/security documentation.

Run real TypeScript project checks (`tsc -b`, since the original `tsc` command only sees an empty root project), frontend builds, and targeted Node regression tests after stages. Run packaged/dev startup if the environment supports it. Live account approval, Windows runtime and distribution-specific checks require external validation; do not claim these as tested.
