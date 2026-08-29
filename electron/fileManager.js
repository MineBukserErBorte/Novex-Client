import fs from "fs/promises";
import path from "path";

function safeRelative(relativePath="") {
  const normalized=String(relativePath).replaceAll("\\","/");
  const parts=normalized.split("/").filter(Boolean);
  if(parts.some(p=>p===".."||p.includes("\0"))) throw new Error("Invalid path.");
  return parts.join(path.sep);
}
export function resolveInside(root, relativePath="") {
  const base=path.resolve(root); const target=path.resolve(base,safeRelative(relativePath));
  if(target!==base&&!target.startsWith(base+path.sep)) throw new Error("Path is outside the instance.");
  return target;
}
export async function listFiles(root,relativePath="") { const dir=resolveInside(root,relativePath); const items=await fs.readdir(dir,{withFileTypes:true}); const out=[]; for(const item of items){const full=path.join(dir,item.name); const st=await fs.stat(full); out.push({name:item.name,path:relativePath?`${relativePath}/${item.name}`:item.name,type:item.isDirectory()?"directory":"file",size:item.isFile()?st.size:0,modified:st.mtimeMs});} return out.sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name):a.type==="directory"?-1:1); }
export async function createFolder(root,relativePath){await fs.mkdir(resolveInside(root,relativePath),{recursive:true});}
export async function deletePath(root,relativePath){await fs.rm(resolveInside(root,relativePath),{recursive:true,force:true});}
export async function renamePath(root,relativePath,newName){const oldPath=resolveInside(root,relativePath);const parent=path.dirname(oldPath);const clean=String(newName).replace(/[<>:"/\\|?*]/g,"").trim();if(!clean)throw new Error("Invalid name.");await fs.rename(oldPath,path.join(parent,clean));}
export async function readText(root,relativePath){const p=resolveInside(root,relativePath);const st=await fs.stat(p);if(st.size>2*1024*1024)throw new Error("File is too large to edit in Novex.");return fs.readFile(p,"utf8");}
export async function writeText(root,relativePath,content){await fs.writeFile(resolveInside(root,relativePath),String(content),"utf8");}
