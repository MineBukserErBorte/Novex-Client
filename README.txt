# Novex Client

Novex Client is a Minecraft launcher/client focused on providing a simple and modern way to manage Minecraft instances, mods, modpacks, resource packs, and more.

> **Novex Client is currently in beta.**
> Features may change, and bugs may occur.

---

## Features

- Minecraft instance management
- Minecraft version installation
- Fabric support
- Mod installation through Modrinth
- Modpack installation through Modrinth
- Resource pack installation through Modrinth
- Favorite mod installation
- Instance file manager
- Minecraft launch and stop controls
- Minecraft console
- Installation progress tracking
- Novex account system
- Supabase-powered account/database system
- Modern desktop interface built with React

More features are planned for future versions.

---

## Screenshots

Screenshots will be added here as Novex develops.

---

## Download

Official releases are available through the Novex Client release page.

**Windows:**
Download the latest `.exe` installer from the Releases section.

> Windows may display a Microsoft Defender SmartScreen warning because Novex Client is currently unsigned and is a new application without an established reputation.
>
> This warning does **not** automatically mean Novex Client is malicious.

Only download Novex Client from official Novex sources.

---

## Source Code

Novex Client's source code is publicly available so users can inspect how the client works.

You can review the source code directly in this repository.

Users are welcome to inspect the code and check it for malicious or suspicious behavior.

**Please note:** The Novex Client license still applies to all source code in this repository.

---

## Security

Security and transparency are important to Novex Client.

The source code is publicly available for inspection.

If you discover a security vulnerability, please report it privately rather than publicly posting sensitive details.

### Never share


## Development and release build

Use Node.js 22+ and install dependencies on the target OS:

    npm ci
    npm run check:electron
    npm test
    npm run build
    npm run dev

Windows NSIS x64: npm run dist:win
Linux AppImage/RPM/DEB x64: npm run dist:linux

See docs/VALIDATION-REPORT.md for tested behavior and remaining manual checks,
docs/SECURITY-AND-OPERATIONS.md for Microsoft sign-in and platform details,
docs/HOME-ADMIN-AND-UPDATES.md for SQL/admin setup and release configuration,
and docs/CURSEFORGE-SETUP.md for the optional source’s current limitations.

CurseForge is not enabled for browsing/installing in this build. Modrinth remains
the default working provider. Microsoft/Minecraft sign-in requires live account
testing; a successful build alone does not establish Minecraft API approval.
