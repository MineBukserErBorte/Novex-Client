import type { MinecraftInstance } from "./instances";
export type FileEntry={name:string; path:string; type:"file"|"directory"; size:number; modified:number};
export async function listFiles(instance:MinecraftInstance, relativePath=""):Promise<FileEntry[]> { return window.novex.files.list(instance, relativePath); }
export async function createFolder(instance:MinecraftInstance, relativePath:string){ return window.novex.files.createFolder(instance, relativePath); }
export async function deleteFile(instance:MinecraftInstance, relativePath:string){ return window.novex.files.delete(instance, relativePath); }
export async function renameFile(instance:MinecraftInstance, relativePath:string, newName:string){ return window.novex.files.rename(instance, relativePath, newName); }
export async function readTextFile(instance:MinecraftInstance, relativePath:string){ return window.novex.files.readText(instance, relativePath); }
export async function writeTextFile(instance:MinecraftInstance, relativePath:string, content:string){ return window.novex.files.writeText(instance, relativePath, content); }
