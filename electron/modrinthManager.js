import fs from "fs/promises";
import path from "path";


const API =
    "https://api.modrinth.com/v2";


/*
 * GET JSON
 */

async function json(
    url
) {

    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            `Modrinth request failed: HTTP ${response.status}`
        );

    }


    return response.json();

}


/*
 * DOWNLOAD FILE
 */

async function download(
    url
) {

    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            `Download failed: HTTP ${response.status}`
        );

    }


    return Buffer.from(

        await response.arrayBuffer()

    );

}


/*
 * GET COMPATIBLE VERSIONS
 */

async function versions(

    projectId,

    gameVersion,

    loader

) {

    const url =
        new URL(

            `${API}/project/${encodeURIComponent(
                projectId
            )}/version`

        );


    if (gameVersion) {

        url.searchParams.set(

            "game_versions",

            JSON.stringify([
                gameVersion
            ])

        );

    }


    /*
     * Only apply loader filtering
     * when installing a loader-based
     * project such as a mod.
     */

    if (

        loader &&
        loader !== "vanilla"

    ) {

        url.searchParams.set(

            "loaders",

            JSON.stringify([
                loader
            ])

        );

    }


    return json(

        url.toString()

    );

}


/*
 * PREVENT ../ PATH ESCAPES
 */

function safeTarget(

    root,

    relativePath

) {

    const resolvedRoot =
        path.resolve(
            root
        );


    const target =
        path.resolve(

            root,

            relativePath

        );


    if (

        target !== resolvedRoot &&

        !target.startsWith(

            resolvedRoot +
            path.sep

        )

    ) {

        throw new Error(
            "Invalid file path."
        );

    }


    return target;

}


/*
 * INSTALL MOD
 */

export async function installMod({

    instanceDirectory,

    projectId,

    versionId,

    gameVersion,

    loader

}) {

    const installed =
        new Set();


    async function install(

        id,

        forcedVersionId = null

    ) {

        const cacheKey =
            forcedVersionId ||
            id;


        if (

            installed.has(
                cacheKey
            )

        ) {

            return;

        }


        let availableVersions;


        /*
         * If a version was explicitly
         * selected, get that exact version.
         */

        if (forcedVersionId) {

            availableVersions = [

                await json(

                    `${API}/version/${encodeURIComponent(
                        forcedVersionId
                    )}`

                )

            ];

        } else {

            availableVersions =
                await versions(

                    id,

                    gameVersion,

                    loader

                );

        }


        const version =
            availableVersions[0];


        if (!version) {

            throw new Error(

                `No compatible Modrinth version for ${id}.`

            );

        }


        installed.add(
            cacheKey
        );


        /*
         * Install required dependencies first.
         */

        for (

            const dependency
            of version.dependencies || []

        ) {

            if (

                dependency.dependency_type !==
                "required"

            ) {

                continue;

            }


            if (
                !dependency.project_id
            ) {

                continue;

            }


            await install(

                dependency.project_id,

                dependency.version_id ||
                null

            );

        }


        /*
         * Find the main downloadable file.
         */

        const file =

            version.files.find(

                file =>
                    file.primary

            ) ||

            version.files[0];


        if (!file) {

            throw new Error(

                `No downloadable file for ${version.name}.`

            );

        }


        const data =
            await download(
                file.url
            );


        const modsDirectory =
            safeTarget(

                instanceDirectory,

                "mods"

            );


        await fs.mkdir(

            modsDirectory,

            {
                recursive: true
            }

        );


        await fs.writeFile(

            safeTarget(

                instanceDirectory,

                path.join(

                    "mods",

                    path.basename(
                        file.filename
                    )

                )

            ),

            data

        );

    }


    await install(

        projectId,

        versionId ||
        null

    );


    return true;

}


/*
 * INSTALL FAVORITE MODS
 */

export async function installFavorites({

    instanceDirectory,

    gameVersion,

    loader,

    projectIds

}) {

    for (

        const projectId
        of projectIds || []

    ) {

        await installMod({

            instanceDirectory,

            projectId,

            gameVersion,

            loader

        });

    }


    return true;

}


/*
 * INSTALL MODPACK
 */

export async function installModpack({

    instanceDirectory,

    projectId,

    versionId

}) {

    if (!versionId) {

        throw new Error(

            "A Modrinth modpack version is required."

        );

    }


    /*
     * Get the exact selected version.
     */

    const version =
        await json(

            `${API}/version/${encodeURIComponent(
                versionId
            )}`

        );


    const file =

        version.files.find(

            file =>
                file.primary

        ) ||

        version.files[0];


    if (!file) {

        throw new Error(

            "This modpack has no downloadable file."

        );

    }


    if (

        !file.filename
            .toLowerCase()
            .endsWith(".mrpack")

    ) {

        throw new Error(

            "The selected file is not a Modrinth .mrpack file."

        );

    }


    /*
     * adm-zip handles the .mrpack archive.
     */

    const AdmZip =
        (

            await import(
                "adm-zip"
            )

        ).default;


    const archive =
        new AdmZip(

            await download(
                file.url
            )

        );


    const entries =
        archive.getEntries();


    /*
     * Find modrinth.index.json.
     */

    const indexEntry =
        entries.find(

            entry =>
                entry.entryName ===
                "modrinth.index.json"

        );


    if (!indexEntry) {

        throw new Error(

            "Invalid modpack: modrinth.index.json is missing."

        );

    }


    const index =
        JSON.parse(

            indexEntry
                .getData()
                .toString(
                    "utf8"
                )

        );


    if (

        index.formatVersion !== 1 &&

        index.formatVersion !== 2

    ) {

        throw new Error(

            `Unsupported Modrinth pack format: ${index.formatVersion}`

        );

    }


    /*
     * Download files listed in
     * modrinth.index.json.
     */

    for (

        const packFile
        of index.files || []

    ) {

        if (

            !packFile.downloads ||

            !packFile.downloads.length

        ) {

            continue;

        }


        const target =
            safeTarget(

                instanceDirectory,

                packFile.path

            );


        await fs.mkdir(

            path.dirname(
                target
            ),

            {
                recursive: true
            }

        );


        await fs.writeFile(

            target,

            await download(

                packFile.downloads[0]

            )

        );

    }


    /*
     * Install overrides.
     */

    for (

        const entry
        of entries

    ) {

        if (
            entry.isDirectory
        ) {

            continue;

        }


        let relativePath =
            null;


        if (

            entry.entryName.startsWith(
                "overrides/"
            )

        ) {

            relativePath =
                entry.entryName.slice(

                    "overrides/"
                        .length

                );

        } else if (

            entry.entryName.startsWith(
                "client-overrides/"
            )

        ) {

            relativePath =
                entry.entryName.slice(

                    "client-overrides/"
                        .length

                );

        }


        if (!relativePath) {

            continue;

        }


        const target =
            safeTarget(

                instanceDirectory,

                relativePath

            );


        await fs.mkdir(

            path.dirname(
                target
            ),

            {
                recursive: true
            }

        );


        await fs.writeFile(

            target,

            entry.getData()

        );

    }


    return {

        projectId,

        versionId,

        name:
            index.name ||
            projectId

    };

}


/*
 * INSTALL RESOURCE PACK
 */

export async function installResourcePack({

    instanceDirectory,

    projectId,

    versionId,

    gameVersion

}) {

    /*
     * Get the exact selected version
     * when the UI supplied one.
     */

    let version;


    if (versionId) {

        version =
            await json(

                `${API}/version/${encodeURIComponent(
                    versionId
                )}`

            );

    } else {

        const availableVersions =
            await versions(

                projectId,

                gameVersion,

                null

            );


        version =
            availableVersions[0];

    }


    if (!version) {

        throw new Error(

            `No compatible resource pack version was found for ${projectId}.`

        );

    }


    /*
     * Find the primary file.
     */

    const file =

        version.files.find(

            file =>
                file.primary

        ) ||

        version.files[0];


    if (!file) {

        throw new Error(

            "This resource pack has no downloadable file."

        );

    }


    /*
     * Resource packs should normally
     * be ZIP files.
     */

    if (

        !file.filename
            .toLowerCase()
            .endsWith(".zip")

    ) {

        throw new Error(

            "The selected resource pack file is not a ZIP file."

        );

    }


    /*
     * Download the resource pack.
     */

    const data =
        await download(

            file.url

        );


    /*
     * Minecraft resource packs belong
     * inside the instance/resourcepacks
     * directory.
     */

    const resourcePacksDirectory =
        safeTarget(

            instanceDirectory,

            "resourcepacks"

        );


    await fs.mkdir(

        resourcePacksDirectory,

        {
            recursive: true
        }

    );


    /*
     * Use only the filename supplied by
     * Modrinth. This prevents a malicious
     * path such as ../../something.exe.
     */

    const filename =
        path.basename(
            file.filename
        );


    const target =
        safeTarget(

            instanceDirectory,

            path.join(

                "resourcepacks",

                filename

            )

        );


    await fs.writeFile(

        target,

        data

    );


    return true;

}