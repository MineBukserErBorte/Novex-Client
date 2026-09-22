import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { applicableLibraries, ensureLibraryArtifacts } from '../electron/natives.js';

test('official artifacts repair Linux-to-Windows copies, reuse hashes, and repair corruption', async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'novex-libraries-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const bytes = Buffer.from('test library');
    const artifact = name => ({ path: name, url: `https://libraries.minecraft.net/${name}`, sha1: crypto.createHash('sha1').update(bytes).digest('hex'), size: bytes.length });
    const windowsPath = 'com/mojang/jtracy/1.14.38/jtracy-1.14.38-natives-windows.jar';
    const profile = { libraries: [
        { name: 'common', downloads: { artifact: artifact('common.jar') } },
        { name: 'linux', rules: [{ action: 'allow', os: { name: 'linux' } }], downloads: { artifact: artifact('linux.jar') } },
        { name: 'windows', rules: [{ action: 'allow', os: { name: 'windows' } }], downloads: { artifact: artifact(windowsPath) } },
    ] };
    assert.deepEqual(applicableLibraries(profile.libraries, 'win32').map(l => l.name), ['common', 'windows']);
    assert.deepEqual(applicableLibraries(profile.libraries, 'linux').map(l => l.name), ['common', 'linux']);
    const downloads = [];
    const download = async (url, target, sha1) => {
        downloads.push(url); assert.equal(sha1, artifact('x').sha1);
        await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, bytes);
    };
    await ensureLibraryArtifacts(profile, directory, download, 'linux', 'x64');
    assert.equal(downloads.length, 2);
    await ensureLibraryArtifacts(profile, directory, download, 'win32', 'x64');
    assert.equal(downloads.length, 3);
    assert.ok(downloads[2].endsWith(windowsPath));
    await ensureLibraryArtifacts(profile, directory, download, 'win32', 'x64');
    assert.equal(downloads.length, 3);
    await fs.writeFile(path.join(directory, 'libraries', windowsPath), 'corrupt');
    await ensureLibraryArtifacts(profile, directory, download, 'win32', 'x64');
    assert.equal(downloads.length, 4);
    profile.libraries[2].downloads.artifact.size++;
    await assert.rejects(ensureLibraryArtifacts(profile, directory, download, 'win32', 'x64'), /integrity/);
});

test('legacy native classifiers use OS and arch, extract safely and reuse valid archives', async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'novex-native-repair-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const zip = new AdmZip(); zip.addFile('test.dll', Buffer.from('native')); zip.addFile('META-INF/test', Buffer.from('skip'));
    const bytes = zip.toBuffer();
    const profile = { libraries: [{ name: 'example:native:1', natives: { windows: 'natives-windows-${arch}' }, downloads: { classifiers: {
        'natives-windows-64': { path: 'example/native.jar', sha1: crypto.createHash('sha1').update(bytes).digest('hex'), size: bytes.length },
    } } }] };
    let downloads = 0;
    const download = async (url, target) => { downloads++; assert.equal(url, 'https://libraries.minecraft.net/example/native.jar'); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, bytes); };
    await ensureLibraryArtifacts(profile, directory, download, 'linux', 'x64'); assert.equal(downloads, 0);
    await ensureLibraryArtifacts(profile, directory, download, 'win32', 'x64'); assert.equal(downloads, 1);
    assert.equal(await fs.readFile(path.join(directory, 'natives/test.dll'), 'utf8'), 'native');
    await assert.rejects(fs.access(path.join(directory, 'natives/META-INF/test')));
    await ensureLibraryArtifacts(profile, directory, download, 'win32', 'x64'); assert.equal(downloads, 1);
    await assert.rejects(ensureLibraryArtifacts(profile, directory, download, 'win32', 'ia32'), /Missing native metadata/);
});
