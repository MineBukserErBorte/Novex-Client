import crypto from 'node:crypto';
export const CLIENT_ID = '4df8fc45-5d5d-4d5d-ad5e-c98203479c15';
export const AUTHORITY = 'https://login.microsoftonline.com/common';
export const AUTH_SCHEME = `msal${CLIENT_ID}`;
export const REDIRECT_URI = `${AUTH_SCHEME}://auth`;
export const SCOPES = ['XboxLive.signin', 'offline_access'];
export function createPkce() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    return { verifier, challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), state: crypto.randomBytes(32).toString('base64url') };
}
export function parseCallback(raw, expectedState) {
    const url = new URL(raw);
    if (url.protocol !== `${AUTH_SCHEME}:` || url.hostname !== 'auth' || url.port || url.username || url.password || (url.pathname && url.pathname !== '/') || url.hash) throw new Error('Invalid Microsoft callback.');
    const state = url.searchParams.get('state') || '';
    if (url.searchParams.getAll('state').length !== 1 || state.length !== expectedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) throw new Error('Microsoft callback state did not match.');
    if (url.searchParams.has('error')) throw new Error(url.searchParams.get('error') === 'access_denied' ? 'Microsoft sign-in cancelled.' : 'Microsoft authentication was declined. Try again.');
    const code = url.searchParams.get('code');
    if (!code || code.length > 16384 || url.searchParams.getAll('code').length !== 1) throw new Error('Microsoft did not return a valid authorization code.');
    return code;
}
