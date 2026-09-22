import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {copyNewDirectory, directorySize, crashHints} from '../electron/localFiles.js';

test('instance/world copy preserves files and empty directories, never overwrites', async t => {
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'novex-copy-'));
    t.after(()=>fs.rm(root,{recursive:true,force:true}));
    const source=path.join(root,'source'),target=path.join(root,'copy');
    await fs.mkdir(path.join(source,'saves','world','empty'),{recursive:true});
    await fs.writeFile(path.join(source,'saves','world','level.dat'),'original');
    await assert.rejects(copyNewDirectory(source,path.join(source,'nested')),/outside the original/);
    await copyNewDirectory(source,target);
    assert.equal(await directorySize(target),8);
    assert.equal((await fs.stat(path.join(target,'saves','world','empty'))).isDirectory(),true);
    await fs.writeFile(path.join(target,'saves','world','level.dat'),'changed');
    assert.equal(await fs.readFile(path.join(source,'saves','world','level.dat'),'utf8'),'original');
    await assert.rejects(copyNewDirectory(source,target),{code:'EEXIST'});
});
test('copies reject symbolic links and clean partial destination without touching source', async t => {
    if(process.platform === 'win32') return t.skip('Symlink permission varies on Windows');
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'novex-links-'));
    t.after(()=>fs.rm(root,{recursive:true,force:true}));
    const source=path.join(root,'source'),target=path.join(root,'copy');
    await fs.mkdir(source);await fs.writeFile(path.join(source,'keep'),'safe');
    await fs.symlink(os.tmpdir(),path.join(source,'outside'));
    await assert.rejects(copyNewDirectory(source,target),/symbolic links/);
    await assert.rejects(fs.stat(target),{code:'ENOENT'});
    assert.equal(await directorySize(source),4);
    assert.equal(await fs.readFile(path.join(source,'keep'),'utf8'),'safe');
});
test('crash hints are conservative and do not expose raw log contents',()=>{
    assert.deepEqual(crashHints('normal shutdown'),[]);
    const hints=crashHints('secret-token java.lang.OutOfMemoryError; UnsupportedClassVersionError; requires fabric-api which is missing; MixinApplyError');
    assert.equal(hints.length,4);
    assert.equal(JSON.stringify(hints).includes('secret-token'),false);
    assert.ok(hints.every(hint=>/Possible cause|Likely related/.test(hint.detail)));
});
