import fs from "fs/promises";
import path from "path";

import { resolveInside, safeSegment } from './pathSafety.js';
export { resolveInside } from './pathSafety.js';
export async function listFiles(root,relativePath="") { const dir=resolveInside(root,relativePath); const items=await fs.readdir(dir,{withFileTypes:true}); const out=[]; for(const item of items){const full=path.join(dir,item.name); const st=await fs.lstat(full); if(st.isSymbolicLink()) continue; out.push({name:item.name,path:relativePath?`${relativePath}/${item.name}`:item.name,type:item.isDirectory()?"directory":"file",size:item.isFile()?st.size:0,modified:st.mtimeMs});} return out.sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name):a.type==="directory"?-1:1); }
export async function createFolder(root,relativePath){await fs.mkdir(resolveInside(root,relativePath),{recursive:true});}
export async function deletePath(root,relativePath){await fs.rm(resolveInside(root,relativePath,false),{recursive:true,force:true});}
export async function renamePath(root,relativePath,newName){const oldPath=resolveInside(root,relativePath,false);const parent=path.dirname(oldPath);const clean=String(newName).replace(/[<>:"/\\|?*]/g,"").trim();safeSegment(clean);await fs.rename(oldPath,resolveInside(root,path.relative(root,path.join(parent,clean)),false));}
export async function readText(root,relativePath){const p=resolveInside(root,relativePath);const st=await fs.stat(p);if(st.size>2*1024*1024)throw new Error("File is too large to edit in Novex.");return fs.readFile(p,"utf8");}
export async function writeText(root,relativePath,content){await fs.writeFile(resolveInside(root,relativePath),validateContent(content),"utf8");}

function validateContent(content) { if (typeof content !== "string" || Buffer.byteLength(content) > 2*1024*1024) throw new Error("Text is too large to save."); return content; }

export async function listInstalledMods(root) {
    const files = await listFiles(root, 'mods').catch(error => { if(error.code === 'ENOENT') return []; throw error; });
    return files.filter(file => file.type === 'file' && /\.jar(?:\.disabled)?$/i.test(file.name))
        .map(file => ({name:file.name, enabled:!file.name.toLowerCase().endsWith('.disabled')}));
}
export async function setModEnabled(root, name, enabled) {
    safeSegment(name, 'mod filename');
    if(typeof enabled !== 'boolean' || !/\.jar(?:\.disabled)?$/i.test(name)) throw new Error('Select an installed mod JAR.');
    const disabled = name.toLowerCase().endsWith('.disabled');
    if(enabled === !disabled) return;
    const source = resolveInside(root, `mods/${name}`);
    const target = resolveInside(root, `mods/${enabled ? name.slice(0,-9) : name+'.disabled'}`);
    if(!(await fs.stat(source)).isFile()) throw new Error('Select a mod file.');
    // Atomic no-clobber rename using a hard link; never overwrite a sibling JAR.
    try { await fs.link(source, target); }
    catch(error) { if(error.code==='EEXIST') throw new Error('The target filename already exists. Neither mod was changed.'); throw error; }
    try { await fs.unlink(source); }
    catch(error) { await fs.unlink(target); throw error; }
}
