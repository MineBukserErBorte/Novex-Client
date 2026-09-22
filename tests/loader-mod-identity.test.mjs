import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {prepareLoaderClient,neoForgeVersionPrefix} from '../electron/loaderSupport.js';
import {identifyInstalledMods} from '../electron/modIdentity.js';
import {validateModrinthVersion} from '../electron/contentValidation.js';
test('official loader prerequisites preserve existing profiles and match NeoForge patch versions',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'novex-loader-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await prepareLoaderClient(root);assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'launcher_profiles.json'))),{profiles:{}});
 await fs.writeFile(path.join(root,'launcher_profiles.json'),'existing');await prepareLoaderClient(root);assert.equal(await fs.readFile(path.join(root,'launcher_profiles.json'),'utf8'),'existing');
 assert.equal(neoForgeVersionPrefix('1.21'),'21.0.');assert.equal(neoForgeVersionPrefix('1.21.1'),'21.1.');assert.equal(neoForgeVersionPrefix('1.21.11'),'21.11.');
 assert.equal('21.1.251'.startsWith(neoForgeVersionPrefix('1.21')),false);
 for(const loader of ['forge','neoforge'])validateModrinthVersion({project_id:'mod',game_versions:['1.21.1'],loaders:[loader]},'mod','1.21.1',loader);
});
test('installed project identity includes renamed and disabled JARs, ignores unknown files and fails closed offline',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'novex-identify-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'mods'));await fs.writeFile(path.join(root,'mods','renamed.jar.disabled'),'known');await fs.writeFile(path.join(root,'mods','unknown.jar'),'unknown');
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const hash=crypto.createHash('sha1').update('known').digest('hex');
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://api.modrinth.com/v2/version_files');assert.equal(JSON.parse(options.body).hashes.length,2);return new Response(JSON.stringify({[hash]:{project_id:'real-id',id:'version'}}));};
 const result=await identifyInstalledMods(root);assert.equal(result.length,1);assert.equal(result[0].enabled,false);assert.equal(result[0].version.project_id,'real-id');
 globalThis.fetch=async()=>new Response('',{status:503});await assert.rejects(identifyInstalledMods(root),/Unable to check/);
});
