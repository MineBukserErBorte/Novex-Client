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
