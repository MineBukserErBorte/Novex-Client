# Optional CurseForge source — operator setup required

## Current implementation status

Modrinth remains the working default. Mods, Modpacks, Resource Packs and the existing Shader Packs panel have an optional source selector with separate per-category preferences. Selecting CurseForge shows a setup-required explanation and makes **no CurseForge API or download request**. It is not a working CurseForge browser/installer yet. Returning to Modrinth restores the existing page and installation flow. Existing favorites, IDs, installed files, accounts and storage are not migrated or modified.

The repository had an empty `src/services/curseforge.ts`; there was no CurseForge integration or content-provider abstraction. `src/services/content.ts` is a file-manager wrapper, not a provider layer. The new shared `ContentSource` boundary keeps the existing Modrinth pages intact. No fictional results, borrowed credentials, HTML scraping or restriction bypass is implemented.

## Why a desktop API key is not a solution

Official documentation checked on 2026-09-17:

- [Apply for third-party API access](https://support.curseforge.com/support/solutions/articles/9000208346): submit Novex through the linked developer application form; CurseForge reviews the request and issues a key upon approval.
- [Third-party API terms](https://support.curseforge.com/support/solutions/articles/9000207405-curseforge-3rd-party-api-terms-and-conditions): the key must not be shared. The published terms also contain restrictions covering caching, competing services and proxies that conceal identity/location. Obtain explicit clarification for Novex's proposed launcher/server arrangement.
- [CDN authentication announcement](https://blog.curseforge.com/introducing-api-key-authentication-for-curseforge-file-downloads/): API-key authentication for direct CDN files became required July 16, 2026. Keeping a key only out of renderer JavaScript is insufficient; an Electron package or local process still cannot protect a shared application credential from its users.

These requirements are why live CurseForge integration is deferred. Do not put a key in VITE variables, package.json, Electron main, GitHub build artifacts, downloadable configuration, or a URL query string.

## Exact operator steps

1. Follow the official application link above and apply for **Novex Client**, with your repository/project details, anticipated requests, all four content types, dependency/modpack installation, and how author distribution opt-outs will be respected.
2. Describe the proposed server-mediated architecture below and request approval/clarification for metadata forwarding, file streaming, retention, attribution and any monetization (including Novex sponsored slides). Do not assume an API key alone approves every arrangement.
3. After approval, deploy a Novex-owned HTTPS backend under the approved terms. Store the key in its secret manager/runtime environment **on the server only**. Do not send it to Codex in chat or add it to the desktop repository. Apply rate limits, abuse protection and request/response size limits. Redact authorization headers from backend diagnostics.
4. Add the approved public service origin to source-controlled Novex configuration, implement the contract below, and run live provider/installer tests before marking CurseForge available in the UI. A public API origin is not a secret; the key is.

## Proposed server/client contract (not deployed)

The backend must be an identified Novex integration, not an anonymous arbitrary proxy. Only fixed project-search, project-details, compatible-files, file-by-ID and approved file-stream operations should exist. Never accept arbitrary upstream URLs. Restrict upstream destinations to documented CurseForge API/CDN hosts; validate each redirect and never forward a credential to another host.

Normalize presentation into `{ provider, projectId, name, description, icon, author, downloads, gameVersions, loaders, type, projectUrl }`. Use namespaced identities such as `modrinth:<id>` and `curseforge:<id>` in any new installed-content records, favorites or update logic. Legacy favorites without a provider remain Modrinth. The current build performs no favorites migration because it stores no CurseForge entries.

Map supported filters using the current official [REST API](https://docs.curseforge.com/rest-api/) game/classes and loader enums. Verify each class/loader against the approved Minecraft endpoint before enabling it. Do not promise client/server or Quilt filters when unavailable. Treat metadata as untrusted plain text/validated HTTPS URLs.

## Installation acceptance criteria before enabling

- Select an exact file; validate Minecraft version, loader, project ID and content type in the main process. Mods go to `mods`, resource packs to `resourcepacks`, shaders to `shaderpacks` inside the selected registered instance.
- Resolve required dependencies with cycle detection, limits and compatible files. Do not guess a Modrinth equivalent by name or interchange provider IDs.
- Respect `allowModDistribution`, absent download URLs and API denials. Offer an official project-page explanation for restricted files; never construct alternate CDN URLs to bypass restrictions.
- Download through the approved server/file route without exposing the application key. Verify the strongest documented API hash, enforce size limits and use atomic writes. Never execute downloaded content as a Novex command.
- CurseForge modpacks are ZIP manifests, not mod JARs or `.mrpack` files. Validate `manifest.json`, its Minecraft/loader information and every projectID/fileID; resolve referenced files through the authorized API, safely extract overrides, reject traversal/symlinks/protected launcher files, and avoid replacing existing worlds/config without an explicit reviewed install plan.
- Test revoked/missing keys, author opt-outs, unavailable dependencies, interrupted downloads, corrupted hashes, all content types and Linux/Windows destinations. Add provider labels to every new record and update/favorite path before publishing support.

Until the approval, backend and tests exist, CurseForge remains clearly unavailable. No secret input field or insecure desktop fallback has been added.
