import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
// Deliberately allowlist diagnostic fields; never serialize raw errors or HTTP bodies.
export async function diagnostic({ stage = 'application', status = 0, serviceCode = '' }) {
    const record = { at: new Date().toISOString(), stage: String(stage).replace(/[^a-zA-Z0-9 :_-]/g, '').slice(0, 100), status: Number(status) || 0, serviceCode: String(serviceCode).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) };
    try {
        const dir = path.join(app.getPath('userData'), 'logs');
        await fs.mkdir(dir, { recursive: true });
        const file = path.join(dir, 'novex.log');
        if ((await fs.stat(file).catch(() => ({ size: 0 }))).size > 1024 * 1024) await fs.rename(file, file + '.previous').catch(() => {});
        await fs.appendFile(file, JSON.stringify(record) + '\n', { mode: 0o600 });
    } catch { /* A logging failure must not expose credentials or break shutdown. */ }
}
