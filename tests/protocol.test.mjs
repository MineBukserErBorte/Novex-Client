import test from 'node:test';
import assert from 'node:assert/strict';
import { protocolDesktop, desktopArgument } from '../electron/protocolRegistration.js';
test('Linux protocol desktop targets stable executable and preserves URL argument', () => {
    const desktop = protocolDesktop('/home/user/Novex Client.AppImage');
    assert.match(desktop, /Exec="\/home\/user\/Novex Client.AppImage" %u\n/);
    assert.match(desktop, /NoDisplay=true/);
    assert.match(desktop, /MimeType=x-scheme-handler\/msal4df8fc45/);
    assert.throws(() => protocolDesktop('relative'));
    assert.throws(() => desktopArgument('/tmp/path\nExec=bad'));
    assert.ok(desktopArgument('/tmp/100%').includes('100%%'));
    assert.ok(desktopArgument('/tmp/$HOME').includes('\\\\$HOME'));
});
