import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { rulesAllowed, javaMajor } from '../electron/platform.js';
import { resolveInside } from '../electron/pathSafety.js';
import { renamePath, deletePath, readText, writeText } from '../electron/fileManager.js';
import { verifyBuffer, secureFetch } from '../electron/downloads.js';
import { nativeArtifact, installNatives } from '../electron/natives.js';
import AdmZip from 'adm-zip';
test('Windows and Linux rules honor OS, architecture and disabled features', () => {
    const item = { rules: [{ action: 'allow', os: { name: 'linux', arch: 'x86_64' } }] };
    assert.equal(rulesAllowed(item, 'linux', 'x64'), true); assert.equal(rulesAllowed(item, 'win32', 'x64'), false);
    assert.equal(rulesAllowed(item, 'linux', 'ia32'), false);
    assert.equal(rulesAllowed({ rules: [{ action: 'allow', features: { is_demo_user: true } }] }), false);
    assert.equal(javaMajor('    java.vm.name = OpenJDK 64-Bit Server VM\nopenjdk version "21.0.1"'),21);
    assert.equal(javaMajor('java version "1.8.0_401"'), 8); assert.equal(javaMajor('openjdk version "21.0.1"'), 21);
});
test('file operations reject traversal, root deletion and symlink escapes', async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'novex-files-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
    for (const name of ['../secret', 'a/../../secret', 'C:\\secret', '/etc/passwd', 'a\\..\\secret', 'a\0b']) assert.throws(() => resolveInside(root, name));
    await assert.rejects(deletePath(root, ''));
    await writeText(root, 'config.txt', 'saved'); assert.equal(await readText(root, 'config.txt'), 'saved');
    await assert.rejects(renamePath(root, 'config.txt', '..'));
    if (process.platform !== 'win32') {
        await fs.symlink(os.tmpdir(), path.join(root, 'outside'));
        assert.throws(() => resolveInside(root, 'outside/secret'));
    }
});
test('download integrity and HTTPS enforced', async () => {
    const bytes = Buffer.from('verified content'); const sha512 = crypto.createHash('sha512').update(bytes).digest('hex');
    assert.equal(verifyBuffer(bytes, { sha512 }), bytes);
    assert.throws(() => verifyBuffer(Buffer.from('changed'), { sha512 }), /integrity/);
    assert.throws(() => verifyBuffer(bytes, {}), /no integrity hash/);
    await assert.rejects(secureFetch('http://example.com/file'), /HTTPS/);
});
test('native classifier uses target platform and archives extract safely', async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'novex-natives-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
    const nativeZip = new AdmZip(); nativeZip.addFile('native.bin', Buffer.from('native')); nativeZip.addFile('META-INF/MANIFEST.MF', Buffer.from('excluded'));
    const nativeBytes = nativeZip.toBuffer();
    const library = { natives: { linux: 'natives-linux', windows: 'natives-windows-${arch}' }, downloads: { classifiers: { 'natives-linux': { path: 'native.jar', url: 'https://example.com/native', sha1: crypto.createHash('sha1').update(nativeBytes).digest('hex') }, 'natives-windows-64': { path: 'windows.jar' } } } };
    assert.equal(nativeArtifact(library, 'win32', 'x64').path, 'windows.jar');
    assert.equal(nativeArtifact(library, 'linux', 'x64').path, 'native.jar');
    const platformLibrary = { ...library, natives: { [process.platform === 'win32' ? 'windows' : 'linux']: 'natives-linux' } };
    await installNatives({ libraries: [platformLibrary] }, root, async (_url, destination) => {
        await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.writeFile(destination, nativeBytes);
    });
    assert.equal(await fs.readFile(path.join(root, 'natives', 'native.bin'), 'utf8'), 'native');
    await assert.rejects(fs.access(path.join(root, 'natives', 'META-INF', 'MANIFEST.MF')));
});

test('Windows classpath is cwd-relative, semicolon-delimited and preserves spaces; Linux stays absolute', async()=>{
    const {launchClasspath}=await import('../electron/platform.js');
    const root='C:\\Users\\A Player\\Novex Instances\\My Fabric';
    const files=[root+'\\libraries\\a library.jar',root+'\\versions\\1.21.1\\1.21.1.jar'];
    assert.equal(launchClasspath(files,root,'win32'),'libraries\\a library.jar;versions\\1.21.1\\1.21.1.jar');
    assert.equal(launchClasspath(['/tmp/instance/a.jar','/tmp/instance/b.jar'],'/tmp/instance','linux'),'/tmp/instance/a.jar:/tmp/instance/b.jar');
});
