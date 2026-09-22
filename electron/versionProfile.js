import fs from 'node:fs/promises';
import path from 'node:path';
import {resolveInside, safeSegment} from './pathSafety.js';

function inheritedArguments(parent = [], child = []) {
    // Older Novex Fabric profiles already contain the vanilla prefix.
    if(parent.every((item,index)=>JSON.stringify(item)===JSON.stringify(child[index]))) return child;
    return [...parent,...child];
}
function libraryKey(library) {
    const [group,artifact,,classifier] = String(library.name).split(':');
    return `${group}:${artifact}:${classifier || ''}`;
}
export async function readVersionProfile(directory, id, ancestors = []) {
    safeSegment(id, 'launch profile');
    if(ancestors.includes(id) || ancestors.length >= 10) throw new Error('Minecraft profile inheritance is cyclic or too deep. Repair this instance.');
    const file=resolveInside(directory,path.join('versions',id,`${id}.json`));
    let child;
    try {child=JSON.parse(await fs.readFile(file,'utf8'));}
    catch(cause) {throw new Error(`Cannot read Minecraft launch profile ${id}. Repair this instance.`,{cause});}
    if(!child || typeof child !== 'object' || Array.isArray(child)) throw new Error(`Invalid Minecraft launch profile ${id}.`);
    if(!child.inheritsFrom) return {data:child, clientVersion:child.jar || child.id || id};
    const parent=await readVersionProfile(directory,child.inheritsFrom,[...ancestors,id]);
    const libraries=new Map((parent.data.libraries || []).map(library=>[libraryKey(library),library]));
    for(const library of child.libraries || []) libraries.set(libraryKey(library),library);
    return {
        data:{...parent.data,...child,libraries:[...libraries.values()],arguments:{
            ...parent.data.arguments,...child.arguments,
            jvm:inheritedArguments(parent.data.arguments?.jvm,child.arguments?.jvm),
            game:child.minecraftArguments && !child.arguments?.game ? [] : inheritedArguments(parent.data.arguments?.game,child.arguments?.game)
        }},
        clientVersion:child.jar || parent.clientVersion
    };
}
