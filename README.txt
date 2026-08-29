NOVEX FEATURE FILES

These are individual drop-in files for the current Novex Client project.
No ZIP is included.

1. Copy src/* into your project's src folder.
2. Copy electron/* into your project's electron folder.
3. Copy .env.example to .env and fill in your Supabase URL + anon key if you want Novex accounts/friends/chat.
4. Run supabase_schema.sql in Supabase SQL Editor.
5. Run npm run build.

Important:
- The existing node_modules in the uploaded project were incomplete on the build environment; your local project should run npm install if Vite/Rollup complains.
- Modrinth search/install works without a Modrinth API key.
- Accounts/friends/chat require a free Supabase project and the two VITE_SUPABASE_* values.
- Modpack browsing UI is included, but full .mrpack extraction/import is intentionally not enabled yet because it needs a proper archive/dependency pipeline.
- The instance editor includes Overview, Mods, Resource Packs, Shaders, Worlds, Files and Settings tabs. Resource Packs/Shaders/Worlds currently use the file browser rooted at the instance; they will be specialized later.
- Java auto-install is not enabled in this batch; the existing launcher still handles Java detection.
