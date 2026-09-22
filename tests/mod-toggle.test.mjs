import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {listInstalledMods,setModEnabled} from '../electron/fileManager.js';
test('mod toggles preserve bytes and filename, list disabled files and reject collisions/traversal',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'novex-toggle-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'mods'));await fs.writeFile(path.join(root,'mods','My Mod.jar'),'original');
 await setModEnabled(root,'My Mod.jar',false);
 assert.deepEqual(await listInstalledMods(root),[{name:'My Mod.jar.disabled',enabled:false}]);
 assert.equal(await fs.readFile(path.join(root,'mods','My Mod.jar.disabled'),'utf8'),'original');
 await setModEnabled(root,'My Mod.jar.disabled',true);
 assert.deepEqual(await listInstalledMods(root),[{name:'My Mod.jar',enabled:true}]);
 await fs.writeFile(path.join(root,'mods','My Mod.jar.disabled'),'other');
 await assert.rejects(setModEnabled(root,'My Mod.jar',false),/already exists/);
 assert.equal(await fs.readFile(path.join(root,'mods','My Mod.jar'),'utf8'),'original');
 assert.equal(await fs.readFile(path.join(root,'mods','My Mod.jar.disabled'),'utf8'),'other');
 await assert.rejects(setModEnabled(root,'../outside.jar',false));
 await assert.rejects(setModEnabled(root,'notes.txt',false));
 if(process.platform !== 'win32') {await fs.symlink(path.join(root,'mods','My Mod.jar'),path.join(root,'mods','link.jar'));await assert.rejects(setModEnabled(root,'link.jar',false),/Symbolic/);}
});
