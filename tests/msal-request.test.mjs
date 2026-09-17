import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicClientApplication } from '@azure/msal-node';
import { AUTHORITY, CLIENT_ID, REDIRECT_URI, SCOPES, createPkce } from '../electron/authProtocol.js';

test('MSAL uses the personal-account authority for both PKCE browser and token requests', async () => {
    const posts = [];
    const endpoint = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
    const client = new PublicClientApplication({
        auth: {
            clientId: CLIENT_ID, authority: AUTHORITY,
            authorityMetadata: JSON.stringify({ authorization_endpoint: endpoint + '/authorize', token_endpoint: endpoint + '/token', issuer: 'https://login.microsoftonline.com/consumers/v2.0', jwks_uri: 'https://login.microsoftonline.com/consumers/discovery/v2.0/keys' }),
        },
        system: { networkClient: {
            async sendGetRequestAsync() { throw new Error('Unexpected metadata network request'); },
            async sendPostRequestAsync(url, options) {
                posts.push({ url, body: new URLSearchParams(options.body) });
                return { status: 400, headers: {}, body: { error: 'invalid_grant', error_description: 'Synthetic expired test code' } };
            }
        } }
    });
    const pkce = createPkce();
    const url = new URL(await client.getAuthCodeUrl({ scopes: SCOPES, redirectUri: REDIRECT_URI, codeChallenge: pkce.challenge, codeChallengeMethod: 'S256', state: pkce.state }));
    assert.equal(url.origin + url.pathname, endpoint + '/authorize');
    assert.equal(url.searchParams.get('client_id'), CLIENT_ID);
    assert.equal(url.searchParams.get('redirect_uri'), REDIRECT_URI);
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    await assert.rejects(client.acquireTokenByCode({ scopes: SCOPES, redirectUri: REDIRECT_URI, code: 'synthetic-test-code', codeVerifier: pkce.verifier }), error => error.errorCode === 'invalid_grant');
    assert.equal(posts.length, 1);
    assert.equal(posts[0].url.split('?')[0], endpoint + '/token');
    assert.equal(posts[0].body.get('code_verifier'), pkce.verifier);
    assert.equal(posts[0].body.get('client_id'), CLIENT_ID);
    assert.equal(posts[0].body.get('redirect_uri'), REDIRECT_URI);
    assert.equal(posts[0].body.has('client_secret'), false);
    assert.ok(posts[0].body.get('scope').toLowerCase().split(' ').includes('xboxlive.signin'));
    assert.ok(!posts[0].body.get('scope').toLowerCase().includes('user.read'));
});
