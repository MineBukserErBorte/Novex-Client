import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AUTH_SCHEME } from './authProtocol.js';
const run = promisify(execFile);

// Desktop Exec is not a shell command. Escape both desktop-string and Exec syntax.
export function desktopArgument(value) {
    if (typeof value !== 'string' || /[\r\n\0]/.test(value)) throw new Error('Invalid application path.');
    return '"' + value.replace(/\\/g, '\\\\\\\\').replace(/"/g, '\\\\"').replace(/`/g, '\\\\`').replace(/\$/g, '\\\\$').replace(/%/g, '%%') + '"';
}
export function protocolDesktop(executable, args = []) {
    if (!path.isAbsolute(executable)) throw new Error('Application path must be absolute.');
    return `[Desktop Entry]\nType=Application\nName=Novex Client Microsoft sign-in\nNoDisplay=true\nTerminal=false\nExec=${[executable, ...args].map(desktopArgument).join(' ')} %u\nMimeType=x-scheme-handler/${AUTH_SCHEME};\nCategories=Game;\n`;
}
export async function ensureAuthProtocol(app, { env = process.env, executable = process.execPath, entry = process.argv[1] } = {}) {
    if (process.platform !== 'linux') {
        const args = process.defaultApp && entry ? [path.resolve(entry)] : undefined;
        if (!app.setAsDefaultProtocolClient(AUTH_SCHEME, executable, args)) throw new Error('Novex could not register Microsoft sign-in. Reinstall Novex and try again.');
        return;
    }
    // APPIMAGE is the persistent outer file, unlike the temporary mounted process.execPath.
    const target = env.APPIMAGE || executable;
    const args = !app.isPackaged && entry ? [path.resolve(entry)] : [];
    await fs.access(target, fs.constants.X_OK);
    const dataHome = env.XDG_DATA_HOME && path.isAbsolute(env.XDG_DATA_HOME) ? env.XDG_DATA_HOME : path.join(os.homedir(), '.local', 'share');
    const directory = path.join(dataHome, 'applications');
    const name = 'novex-auth.desktop';
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    const destination = path.join(directory, name);
    await fs.writeFile(destination + '.tmp', protocolDesktop(target, args), { mode: 0o600 });
    await fs.rename(destination + '.tmp', destination);
    try {
        await run('xdg-mime', ['default', name, `x-scheme-handler/${AUTH_SCHEME}`], { timeout: 10000 });
        const { stdout } = await run('xdg-mime', ['query', 'default', `x-scheme-handler/${AUTH_SCHEME}`], { timeout: 10000 });
        if (stdout.trim() !== name) throw new Error('unregistered');
    } catch {
        throw new Error('Linux could not register the Microsoft callback. Install xdg-utils using your distribution’s software manager, then retry sign-in.');
    }
}
