import fs from "fs/promises";
import path from "path";
import { app } from "electron";
import { getSettings } from "./settings.js";
import { safeSegment, assertNoSymlinks } from "./pathSafety.js";
const issuedDirectories = new Set();
let registry;
async function loadRegistry() {
    if (!registry) {
        try { registry = JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'instance-paths.json'), 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw new Error('Instance path registry is unreadable. Restore instance-paths.json.'); registry = {}; }
    }
}
async function remember(id, directory) {
    registry[id] = directory;
    await fs.mkdir(app.getPath('userData'), { recursive: true });
    await fs.writeFile(path.join(app.getPath('userData'), 'instance-paths.json'), JSON.stringify(registry, null, 2));
    issuedDirectories.add(directory);
    return directory;
}
export function validateInstanceDirectory(directory) {
    if (typeof directory !== 'string' || !issuedDirectories.has(path.resolve(directory))) throw new Error('Select a registered Novex instance first.');
    return assertNoSymlinks(directory);
}

async function getInstancesDirectory() {
    return (await getSettings()).instancesDirectory;
}
async function ensureInstancesDirectory() {
    await fs.mkdir(assertNoSymlinks(await getInstancesDirectory()), { recursive: true });
}

function sanitizeName(name) {
    return String(name)
        .replace(/[<>:"/\\|?*]/g, "")
        .trim();
}

async function getInstancePath(instance) {
    if (!instance || typeof instance.name !== 'string' || instance.name.length > 160) throw new Error('Invalid instance.');
    safeSegment(instance.id, 'instance ID');
    const safeName = sanitizeName(instance.name);
    safeSegment(safeName, 'instance name');
    await loadRegistry();
    if (Object.hasOwn(registry, instance.id)) {
        const directory = assertNoSymlinks(registry[instance.id]);
        issuedDirectories.add(directory);
        return directory;
    }
    // Retain legacy data even when the user changes the default storage location.
    const roots = [...new Set([path.join(app.getPath('userData'), 'instances'), await getInstancesDirectory()])];
    for (const root of roots) {
        for (const name of await fs.readdir(root).catch(() => [])) {
            if (name.endsWith('-' + instance.id)) return remember(instance.id, assertNoSymlinks(path.join(root, name)));
        }
    }
    return remember(instance.id, assertNoSymlinks(path.join(await getInstancesDirectory(), `${safeName}-${instance.id}`)));
}

export async function createInstanceDirectory(instance) {

    await ensureInstancesDirectory();

    const instanceDirectory =
        await getInstancePath(instance);

    await fs.mkdir(
        instanceDirectory,
        {
            recursive: true
        }
    );

    const directories = [
        "mods",
        "config",
        "saves",
        "resourcepacks",
        "shaderpacks",
        "screenshots"
    ];

    for (const directory of directories) {

        await fs.mkdir(
            path.join(
                instanceDirectory,
                directory
            ),
            {
                recursive: true
            }
        );
    }

    await fs.writeFile(
        path.join(
            instanceDirectory,
            "instance.json"
        ),
        JSON.stringify(
            instance,
            null,
            2
        ),
        "utf8"
    );

    return instanceDirectory;
}

export async function deleteInstanceDirectory(instance) {

    await ensureInstancesDirectory();

    const instanceDirectory =
        await getInstancePath(instance);

    await fs.rm(
        instanceDirectory,
        {
            recursive: true,
            force: true
        }
    );
}

export async function getInstanceDirectory(instance) {

    await ensureInstancesDirectory();

    return await getInstancePath(instance);
}