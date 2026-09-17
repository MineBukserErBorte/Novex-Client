import fs from 'node:fs';
import path from 'node:path';

export function safeSegment(value, label = 'name') {
    if (typeof value !== 'string' || !value || value.length > 240 ||
        /[<>:"/\\|?*\x00-\x1f]/.test(value) || value === '.' || value === '..' || /[. ]$/.test(value) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)) {
        throw new Error(`Invalid ${label}.`);
    }
    return value;
}

// Reject symlinks/junctions in every existing component, including the root.
// This also covers not-yet-created files; lexical checks alone are insufficient.
export function assertNoSymlinks(target) {
    const absolute = path.resolve(target);
    let cursor = path.parse(absolute).root;
    for (const part of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
        cursor = path.join(cursor, part);
        try {
            if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Symbolic links are not supported in managed instance paths.');
        } catch (error) {
            if (error.code === 'ENOENT') break;
            throw error;
        }
    }
    return absolute;
}

export function resolveInside(root, relative = '', allowRoot = true) {
    if (typeof relative !== 'string' || relative.includes('\0') || path.win32.isAbsolute(relative) || path.posix.isAbsolute(relative)) {
        throw new Error('Invalid relative path.');
    }
    const parts = relative.replaceAll('\\', '/').split('/').filter(Boolean);
    for (const part of parts) safeSegment(part, 'path');
    const base = path.resolve(root);
    const target = path.resolve(base, ...parts);
    if ((!allowRoot && target === base) || (target !== base && !target.startsWith(base + path.sep))) {
        throw new Error('Path is outside the instance.');
    }
    return assertNoSymlinks(target);
}
