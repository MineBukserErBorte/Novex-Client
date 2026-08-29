import fs from "fs/promises";
import path from "path";
import { app } from "electron";

function getInstancesDirectory() {
    return path.join(
        app.getPath("userData"),
        "instances"
    );
}

async function ensureInstancesDirectory() {
    await fs.mkdir(
        getInstancesDirectory(),
        {
            recursive: true
        }
    );
}

function sanitizeName(name) {
    return String(name)
        .replace(/[<>:"/\\|?*]/g, "")
        .trim();
}

function getInstancePath(instance) {
    const safeName = sanitizeName(instance.name);

    return path.join(
        getInstancesDirectory(),
        `${safeName}-${instance.id}`
    );
}

export async function createInstanceDirectory(instance) {

    await ensureInstancesDirectory();

    const instanceDirectory =
        getInstancePath(instance);

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
        getInstancePath(instance);

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

    return getInstancePath(instance);
}