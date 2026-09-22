import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { resolveInside } from './pathSafety.js';
import { rulesAllowed } from './platform.js';
export function applicableLibraries(libraries, platform = process.platform, arch = process.arch) {
    // Do not pass rulesAllowed directly to filter: its second argument is the OS, not the index.
    return libraries.filter(library => rulesAllowed(library, platform, arch));
}

export async function downloadLibraryArtifact(library, artifact, directory, downloadFile) {
    const destination = resolveInside(path.join(directory, 'libraries'), artifact.path, false);
    const valid = buffer => (!Number.isInteger(artifact.size) || buffer.length === artifact.size)
        && (!artifact.sha1 || crypto.createHash('sha1').update(buffer).digest('hex') === artifact.sha1.toLowerCase());
    if (artifact.sha1) {
        try { if (valid(await fs.readFile(destination))) return false; }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    const url = artifact.url || new URL(artifact.path.replaceAll('\\', '/'), (library.url || 'https://libraries.minecraft.net/').replace(/\/?$/, '/')).href;
    await downloadFile(url, destination, artifact.sha1);
    if (!valid(await fs.readFile(destination))) throw new Error(`Library integrity check failed: ${artifact.path}`);
    return true;
}

export async function ensureLibraryArtifacts(profile, directory, downloadFile, platform = process.platform, arch = process.arch) {
    let repaired = 0;
    for (const library of applicableLibraries(profile.libraries || [], platform, arch)) {
        if (library.downloads?.artifact && await downloadLibraryArtifact(library, library.downloads.artifact, directory, downloadFile)) repaired++;
    }
    await installNatives(profile, directory, downloadFile, platform, arch);
    return repaired;
}

export function nativeArtifact(library, platform = process.platform, arch = process.arch) {
    const osName = platform === 'win32' ? 'windows' : platform === 'darwin' ? 'osx' : 'linux';
    const classifier = library.natives?.[osName]?.replaceAll('${arch}', arch === 'ia32' ? '32' : '64');
    if (!classifier) return null;
    const artifact = library.downloads?.classifiers?.[classifier];
    if (!artifact) throw new Error(`Missing native metadata for ${library.name}: ${classifier}`);
    return artifact;
}
export async function installNatives(profile, directory, downloadFile, platform = process.platform, arch = process.arch) {
    const root = resolveInside(directory, 'natives');
    await fs.mkdir(root, { recursive: true });
    for (const library of applicableLibraries(profile.libraries || [], platform, arch)) {
        const artifact = nativeArtifact(library, platform, arch);
        if (!artifact) continue; // Modern LWJGL embeds natives in classpath jars.
        const archivePath = resolveInside(path.join(directory, 'libraries'), artifact.path, false);
        await downloadLibraryArtifact(library, artifact, directory, downloadFile);
        const zip = new AdmZip(archivePath);
        for (const entry of zip.getEntries()) {
            if (entry.isDirectory || entry.entryName.startsWith('META-INF/') || (library.extract?.exclude || []).some(prefix => entry.entryName.startsWith(prefix))) continue;
            if (((entry.attr >>> 16) & 0o170000) === 0o120000) throw new Error('Native archive contains a symbolic link.');
            const target = resolveInside(root, entry.entryName, false);
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(target, entry.getData());
        }
    }
}
