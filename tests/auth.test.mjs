import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createPkce, parseCallback, REDIRECT_URI } from '../electron/authProtocol.js';
import { authenticateMinecraft } from '../electron/minecraftAuth.js';
const uuid = '1234567890abcdef1234567890abcdef';
const success = [
    { Token: 'xbox-secret', DisplayClaims: { xui: [{ uhs: '42' }] } },
    { Token: 'xsts-secret', DisplayClaims: { xui: [{ uhs: '42' }] } },
    { access_token: 'minecraft-secret', expires_in: 3600 },
    { items: [{ name: 'game_minecraft' }] },
    { id: uuid, name: 'RealPlayer', skins: [{ state: 'ACTIVE', url: 'http://textures.minecraft.net/texture/abc' }] }
];
function fixture(responses = success) {
    const calls = [];
    return { calls, fetcher: async (url, options) => { calls.push({ url, options }); const item = responses[calls.length - 1]; return new Response(JSON.stringify(item?.data ?? item), { status: item?.status || 200 }); } };
}
test('PKCE is S256 and callback requires exact redirect and state', () => {
    const pkce = createPkce();
    assert.equal(pkce.challenge, crypto.createHash('sha256').update(pkce.verifier).digest('base64url'));
    assert.equal(parseCallback(`${REDIRECT_URI}?state=${pkce.state}&code=valid`, pkce.state), 'valid');
    for (const uri of [`${REDIRECT_URI}?state=wrong&code=x`, `${REDIRECT_URI}/other?state=${pkce.state}&code=x`, `${REDIRECT_URI}?state=${pkce.state}&state=${pkce.state}&code=x`, `${REDIRECT_URI}?state=${pkce.state}&code=a&code=b`]) assert.throws(() => parseCallback(uri, pkce.state));
    assert.throws(() => parseCallback(`${REDIRECT_URI}?state=${pkce.state}&error=access_denied`, pkce.state), /cancelled/);
});
test('full authentication exchange checks ownership and profile', async () => {
    const f = fixture(); const progress = [];
    const result = await authenticateMinecraft('microsoft-secret', { ...f, progress: text => progress.push(text) });
    assert.equal(result.username, 'RealPlayer'); assert.equal(result.uuid, uuid); assert.equal(result.userType, 'msa');
    assert.equal(result.skinUrl, 'https://textures.minecraft.net/texture/abc');
    assert.equal(JSON.parse(f.calls[0].options.body).Properties.RpsTicket, 'd=microsoft-secret');
    assert.equal(JSON.parse(f.calls[2].options.body).identityToken, 'XBL3.0 x=42;xsts-secret');
    assert.equal(f.calls[3].options.headers.Authorization, 'Bearer minecraft-secret');
    assert.equal(f.calls.length, 5); assert.equal(progress.length, 5);
});
test('ownership failure never produces a profile or local account', async () => {
    const f = fixture([...success.slice(0, 3), { items: [] }]);
    await assert.rejects(authenticateMinecraft('secret', f), /Java Edition was not found/);
    assert.equal(f.calls.length, 4);
});
test('Minecraft application rejection is distinct and diagnostics contain no tokens', async () => {
    const f = fixture([...success.slice(0, 2), { status: 403, data: { error: 'ForbiddenOperationException', message: 'sensitive-content', access_token: 'secret' } }]);
    const logs = [];
    await assert.rejects(authenticateMinecraft('secret', { ...f, diagnostic: d => logs.push(d) }), /Novex has not yet been authorized/);
    assert.deepEqual(logs, [{ stage: 'Minecraft Services', status: 403, serviceCode: 'ForbiddenOperationException' }]);
});
test('XSTS child restriction and missing profile produce useful errors', async () => {
    await assert.rejects(authenticateMinecraft('secret', fixture([success[0], { status: 401, data: { XErr: 2148916238 } }])), /Microsoft family/);
    await assert.rejects(authenticateMinecraft('secret', fixture([...success.slice(0, 4), { status: 404, data: {} }])), /No Minecraft Java profile/);
});
test('malformed identity, expired service auth, cancellation and network errors fail closed', async () => {
    await assert.rejects(authenticateMinecraft('secret', fixture([...success.slice(0, 4), { id: 'fake', name: 'Player' }])), /invalid Java profile/);
    await assert.rejects(authenticateMinecraft('secret', fixture([...success.slice(0, 3), { status: 401, data: {} }])), /HTTP 401/);
    const fetcher = async () => { throw new Error('request with secret'); };
    await assert.rejects(authenticateMinecraft('secret', { fetcher }), /Check your network/);
    await assert.rejects(authenticateMinecraft('secret', { fetcher, signal: AbortSignal.abort() }), /cancelled/);
});
