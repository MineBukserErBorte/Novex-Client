// No service response bodies are logged or forwarded to the renderer.
export class AuthError extends Error {
    constructor(message, stage, status = 0, serviceCode = '') { super(message); this.stage = stage; this.status = status; this.serviceCode = serviceCode; }
}
export async function authenticateMinecraft(microsoftToken, { fetcher = fetch, progress = () => {}, signal, diagnostic = () => {} } = {}) {
    async function request(stage, url, body, token) {
        let response;
        try {
            response = await fetcher(url, {
                method: body ? 'POST' : 'GET', redirect: 'error',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: body ? JSON.stringify(body) : undefined,
                signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000)
            });
        } catch {
            throw new AuthError(signal?.aborted ? 'Microsoft sign-in cancelled.' : `Cannot reach ${stage}. Check your network and try again.`, stage);
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const code = Number.isSafeInteger(data.XErr) ? String(data.XErr) : ['ForbiddenOperationException', 'NOT_FOUND'].includes(data.error) ? data.error : '';
            diagnostic({ stage, status: response.status, serviceCode: code });
            let message = `${stage} authentication failed (HTTP ${response.status}). Try signing in again.`;
            if (stage === 'Minecraft Services' && response.status === 403) message = 'Microsoft sign-in succeeded, but Novex has not yet been authorized to access Minecraft Services.';
            else if (stage === 'Minecraft profile' && response.status === 404) message = 'No Minecraft Java profile was found. Create your Java profile on minecraft.net, then try again.';
            else if (stage === 'XSTS') message = ({
                '2148916233': 'This Microsoft account has no Xbox profile. Create one on xbox.com, then try again.',
                '2148916235': 'Xbox Live is unavailable for this account’s country or region.',
                '2148916236': 'Xbox requires age verification for this account.',
                '2148916237': 'Xbox requires age verification for this account.',
                '2148916238': 'This child account must be added to a Microsoft family before Xbox sign-in.'
            })[code] || message;
            throw new AuthError(message, stage, response.status, code);
        }
        return data;
    }
    progress('Connecting to Xbox Live...');
    const xbox = await request('Xbox Live', 'https://user.auth.xboxlive.com/user/authenticate', {
        Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${microsoftToken}` }, RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT'
    });
    if (!xbox.Token) throw new AuthError('Xbox Live returned no authentication token.', 'Xbox Live');
    progress('Authenticating with XSTS...');
    const xsts = await request('XSTS', 'https://xsts.auth.xboxlive.com/xsts/authorize', {
        Properties: { SandboxId: 'RETAIL', UserTokens: [xbox.Token] }, RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT'
    });
    const uhs = xsts.DisplayClaims?.xui?.[0]?.uhs;
    if (!xsts.Token || !uhs || (xbox.DisplayClaims?.xui?.[0]?.uhs && xbox.DisplayClaims.xui[0].uhs !== uhs)) throw new AuthError('XSTS returned an invalid Xbox identity.', 'XSTS');
    progress('Connecting to Minecraft...');
    const minecraft = await request('Minecraft Services', 'https://api.minecraftservices.com/authentication/login_with_xbox', { identityToken: `XBL3.0 x=${uhs};${xsts.Token}` });
    if (typeof minecraft.access_token !== 'string' || !Number.isFinite(minecraft.expires_in) || minecraft.expires_in <= 0) throw new AuthError('Minecraft Services returned an invalid session.', 'Minecraft Services');
    progress('Checking Minecraft ownership...');
    const ownership = await request('Minecraft ownership', 'https://api.minecraftservices.com/entitlements/mcstore', undefined, minecraft.access_token);
    if (!Array.isArray(ownership.items) || !ownership.items.some(item => ['game_minecraft', 'product_minecraft'].includes(item.name))) throw new AuthError('Minecraft: Java Edition was not found on this Microsoft account.', 'Minecraft ownership');
    progress('Loading Minecraft profile...');
    const profile = await request('Minecraft profile', 'https://api.minecraftservices.com/minecraft/profile', undefined, minecraft.access_token);
    if (!/^[a-f0-9]{32}$/i.test(profile.id || '') || !/^[A-Za-z0-9_]{1,16}$/.test(profile.name || '')) throw new AuthError('Minecraft returned a missing or invalid Java profile.', 'Minecraft profile');
    const rawSkin = profile.skins?.find(skin => skin.state === 'ACTIVE')?.url;
    let skinUrl;
    if (rawSkin) { try { const url = new URL(rawSkin); if (url.hostname === 'textures.minecraft.net' && ['http:', 'https:'].includes(url.protocol)) { url.protocol = 'https:'; skinUrl = url.href; } } catch {} }
    return { username: profile.name, uuid: profile.id, skinUrl, accessToken: minecraft.access_token, expiresAt: Date.now() + minecraft.expires_in * 1000, userType: 'msa', xuid: xsts.DisplayClaims?.xui?.[0]?.xid || '' };
}
