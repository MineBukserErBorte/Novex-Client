import { app, safeStorage } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
const memory = new Map();
const writes = new Map();
export async function secureStorageAvailable() {
    const available = await safeStorage.isAsyncEncryptionAvailable();
    return available && (process.platform !== 'linux' || !['basic_text', 'unknown'].includes(safeStorage.getSelectedStorageBackend()));
}
export async function readSecure(name) {
    if (memory.has(name)) return memory.get(name);
    if (!await secureStorageAvailable()) {
        try { await fs.access(path.join(app.getPath('userData'), name + '.encrypted')); }
        catch (error) { if (error.code === 'ENOENT') return null; throw error; }
        throw new Error('Unlock your desktop keyring and restart Novex to access saved authentication.');
    }
    try {
        const encrypted = await fs.readFile(path.join(app.getPath('userData'), name + '.encrypted'));
        const { result } = await safeStorage.decryptStringAsync(encrypted);
        memory.set(name, result);
        return result;
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw new Error('The secure account cache cannot be unlocked. Unlock your desktop keyring and restart Novex.');
    }
}
export function writeSecure(name, value) {
    const pending = (writes.get(name) || Promise.resolve()).catch(() => {}).then(() => saveSecure(name, value));
    writes.set(name, pending);
    return pending;
}
async function saveSecure(name, value) {
    memory.set(name, value);
    if (!await secureStorageAvailable()) return false;
    const file = path.join(app.getPath('userData'), name + '.encrypted');
    await fs.mkdir(app.getPath('userData'), { recursive: true });
    await fs.writeFile(file + '.tmp', await safeStorage.encryptStringAsync(value), { mode: 0o600 });
    await fs.rename(file + '.tmp', file);
    return true;
}
