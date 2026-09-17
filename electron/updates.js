import { app, shell } from 'electron';
import { RELEASE_API, RELEASES_URL, releaseVersion } from './updateSource.js';
let cached;
let lastCheck = 0;
let pending;
export function checkUpdates() {
    // No renderer URL, credentials, Supabase data, or private repository token.
    if (pending) return pending;
    if (cached && Date.now() - lastCheck < 60000) return Promise.resolve(cached);
    pending = query().finally(() => { pending = undefined; });
    return pending;
}
async function query() {
    const current = app.getVersion();
    try {
        const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error', signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(response.status === 404 ? 'No public release is available yet. Private repositories need a public release channel.' : 'Release information is unavailable. Try again later.');
        const body = await response.text();
        if (body.length > 2 * 1024 * 1024) throw new Error('Release information was too large.');
        const release = JSON.parse(body);
        const newer = releaseVersion(current, release);
        const formats = process.platform === 'win32' ? ['.exe'] : ['.AppImage', '.rpm', '.deb'];
        const available = newer && newer.formats.some(format => formats.includes(format));
        cached = { current, latest: newer?.latest || current, available: Boolean(available), releasesUrl: RELEASES_URL, message: newer && !available ? 'A newer release exists, but an installer for this platform is not available yet.' : '', checkedAt: Date.now() };
        lastCheck = Date.now();
        return cached;
    } catch (error) {
        return { current, latest: null, available: false, releasesUrl: RELEASES_URL, message: error?.message?.startsWith('No public release') ? error.message : 'Could not check for updates. Check your network or try again later.', checkedAt: null };
    }
}
export async function openUpdate() {
    const result = await checkUpdates();
    if (!result.available) throw new Error(result.message || 'No newer release is available.');
    // The trusted page shows package choices and checksums. Nothing is executed.
    return shell.openExternal(`${RELEASES_URL}/tag/v${result.latest}`);
}
