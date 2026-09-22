import fs from 'node:fs/promises';
import {resolveInside} from './pathSafety.js';
export async function prepareLoaderClient(directory) {
    // Official installers require a launcher profile, even in an isolated Novex
    // instance. Never copy account data or overwrite an existing profile.
    await fs.writeFile(resolveInside(directory,'launcher_profiles.json'),JSON.stringify({profiles:{}}),{flag:'wx'})
        .catch(error=>{if(error.code!=='EEXIST')throw error;});
}
export function neoForgeVersionPrefix(minecraftVersion) {
    if(!/^\d+\.\d+(?:\.\d+)?$/.test(minecraftVersion))throw new Error('NeoForge requires a supported release version of Minecraft.');
    const [major,minor,patch='0']=minecraftVersion.split('.');
    return major==='1' ? `${minor}.${patch}.` : `${minecraftVersion}.`;
}
