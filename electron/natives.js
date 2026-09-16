import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { resolveInside } from './pathSafety.js';
import { rulesAllowed } from './platform.js';
export function nativeArtifact(library, platform = process.platform, arch = process.arch) {
    const osName = platform === 'win32' ? 'windows' : platform === 'darwin' ? 'osx' : 'linux';
    const classifier = library.natives?.[osName]?.replaceAll('${arch}', arch === 'ia32' ? '32' : '64');
    return classifier ? library.downloads?.classifiers?.[classifier] : null;
}
export async function installNatives(profile, directory, downloadFile) {
    const root = resolveInside(directory, 'natives');
    await fs.mkdir(root, { recursive: true });
    for (const library of profile.libraries || []) {
        if (!rulesAllowed(library)) continue;
        const artifact = nativeArtifact(library);
        if (!artifact) continue; // Modern LWJGL embeds natives in classpath jars.
        const archivePath = resolveInside(path.join(directory, 'libraries'), artifact.path, false);
        await downloadFile(artifact.url, archivePath, artifact.sha1);
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
