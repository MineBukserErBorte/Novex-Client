import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

let minecraftProcess = null;


/*
 * ============================================================
 * JAVA
 * ============================================================
 */

function getJavaExecutable() {
    if (process.platform === "win32") {
        return "javaw.exe";
    }

    return "java";
}


/*
 * ============================================================
 * INSTALLATION INFO
 * ============================================================
 *
 * Novex stores information about what is installed in:
 *
 * instance/
 *   installation.json
 *
 * Example:
 *
 * {
 *   "minecraftVersion": "1.21.11",
 *   "loader": "fabric",
 *   "loaderVersion": "0.19.3",
 *   "launchVersion": "fabric-loader-0.19.3-1.21.11"
 * }
 *
 * Vanilla simply uses the Minecraft version as launchVersion.
 *
 * ============================================================
 */

async function readInstallationInfo(instanceDirectory) {
    const installationFile = path.join(
        instanceDirectory,
        "installation.json"
    );

    try {
        const raw = await fs.readFile(
            installationFile,
            "utf8"
        );

        return JSON.parse(raw);
    } catch {
        return null;
    }
}


/*
 * ============================================================
 * LIBRARY RULES
 * ============================================================
 */

function isLibraryAllowed(library) {
    if (!library.rules) {
        return true;
    }

    const currentOS =
        process.platform === "win32"
            ? "windows"
            : process.platform === "darwin"
                ? "osx"
                : "linux";

    let allowed = false;

    for (const rule of library.rules) {
        if (
            rule.os?.name &&
            rule.os.name !== currentOS
        ) {
            continue;
        }

        if (rule.action === "allow") {
            allowed = true;
        }

        if (rule.action === "disallow") {
            allowed = false;
        }
    }

    return allowed;
}


/*
 * ============================================================
 * CLASSPATH
 * ============================================================
 */

function getMavenLibraryPath(
    name
) {

    if (
        typeof name !== "string" ||
        !name.trim()
    ) {

        return null;

    }


    let coordinate =
        name.trim();

    let extension =
        "jar";


    const atIndex =
        coordinate.lastIndexOf(
            "@"
        );


    if (
        atIndex !== -1
    ) {

        extension =
            coordinate.slice(
                atIndex + 1
            ) ||
            "jar";

        coordinate =
            coordinate.slice(
                0,
                atIndex
            );

    }


    const parts =
        coordinate.split(":");


    if (
        parts.length < 3
    ) {

        return null;

    }


    const [
        group,
        artifact,
        version,
        classifier
    ] = parts;


    const groupPath =
        group.replace(
            /\./g,
            "/"
        );


    const fileName =
        [
            artifact,
            version,
            classifier
        ]
            .filter(Boolean)
            .join("-") +
        `.${extension}`;


    return path.join(
        groupPath,
        artifact,
        version,
        fileName
    );

}


async function buildClasspath(
    instanceDirectory,
    versionData
) {

    const classpath = [];

    const seen =
        new Set();


    for (
        const library of
        versionData.libraries || []
    ) {

        if (
            !isLibraryAllowed(
                library
            )
        ) {

            continue;

        }


        let relativePath =
            library.downloads
                ?.artifact
                ?.path;


        if (!relativePath) {

            relativePath =
                getMavenLibraryPath(
                    library.name
                );

        }


        if (!relativePath) {
            continue;
        }


        const libraryPath =
            path.join(
                instanceDirectory,
                "libraries",
                relativePath
            );


        if (
            seen.has(
                libraryPath
            )
        ) {

            continue;

        }


        seen.add(
            libraryPath
        );


        try {

            await fs.access(
                libraryPath
            );

        } catch {

            throw new Error(
                `Required Minecraft library is missing: ${relativePath}`
            );

        }


        classpath.push(
            libraryPath
        );

    }


    /*
     * Loader profiles inherit the
     * actual Minecraft client JAR.
     */

    const clientVersion =
        versionData.inheritsFrom ||
        versionData.id;


    const clientJar =
        path.join(
            instanceDirectory,
            "versions",
            clientVersion,
            `${clientVersion}.jar`
        );


    try {

        await fs.access(
            clientJar
        );

    } catch {

        throw new Error(
            `Minecraft client JAR is missing: ${clientJar}`
        );

    }


    classpath.push(
        clientJar
    );


    return classpath.join(
        process.platform ===
        "win32"
            ? ";"
            : ":"
    );

}


/*
 * ============================================================
 * ARGUMENT VARIABLE REPLACEMENT
 * ============================================================
 */

function replaceArgumentVariables(
    argument,
    values
) {
    let result = argument;

    for (
        const [key, value] of Object.entries(values)
    ) {
        result = result.replaceAll(
            `\${${key}}`,
            String(value ?? "")
        );
    }

    return result;
}


/*
 * ============================================================
 * ARGUMENT RULES
 * ============================================================
 */

function argumentRuleAllowed(entry) {
    if (!entry?.rules) {
        return true;
    }

    const currentOS =
        process.platform === "win32"
            ? "windows"
            : process.platform === "darwin"
                ? "osx"
                : "linux";

    let allowed = false;

    for (const rule of entry.rules) {
        if (
            rule.os?.name &&
            rule.os.name !== currentOS
        ) {
            continue;
        }

        if (rule.action === "allow") {
            allowed = true;
        }

        if (rule.action === "disallow") {
            allowed = false;
        }
    }

    return allowed;
}


/*
 * ============================================================
 * PARSE MODERN ARGUMENTS
 * ============================================================
 */

function parseMinecraftArguments(
    argumentsList,
    values
) {
    const result = [];

    if (!Array.isArray(argumentsList)) {
        return result;
    }

    for (const entry of argumentsList) {

        if (typeof entry === "string") {
            result.push(
                replaceArgumentVariables(
                    entry,
                    values
                )
            );

            continue;
        }

        if (
            typeof entry !== "object" ||
            entry === null
        ) {
            continue;
        }

        if (!argumentRuleAllowed(entry)) {
            continue;
        }

        const value = entry.value;

        if (Array.isArray(value)) {

            for (const item of value) {
                result.push(
                    replaceArgumentVariables(
                        item,
                        values
                    )
                );
            }

        } else if (typeof value === "string") {

            result.push(
                replaceArgumentVariables(
                    value,
                    values
                )
            );
        }
    }

    return result;
}


/*
 * ============================================================
 * REMOVE DUPLICATE QUICK PLAY OPTIONS
 * ============================================================
 */

function removeDuplicateQuickPlayArguments(
    argumentsList
) {
    const quickPlayArguments = new Set([
        "--quickPlayPath",
        "--quickPlaySingleplayer",
        "--quickPlayMultiplayer",
        "--quickPlayRealms"
    ]);

    const result = [];

    let quickPlayFound = false;

    for (
        let i = 0;
        i < argumentsList.length;
        i++
    ) {
        const argument =
            argumentsList[i];

        if (
            quickPlayArguments.has(argument)
        ) {

            if (quickPlayFound) {

                /*
                 * Remove this option and its value.
                 */

                if (
                    i + 1 <
                    argumentsList.length
                ) {
                    i++;
                }

                continue;
            }

            quickPlayFound = true;
        }

        result.push(argument);
    }

    return result;
}


/*
 * ============================================================
 * LEGACY ARGUMENTS
 * ============================================================
 */

function parseLegacyGameArguments(
    minecraftArguments,
    values
) {
    if (
        typeof minecraftArguments !== "string"
    ) {
        return [];
    }

    return minecraftArguments
        .split(/\s+/)
        .filter(Boolean)
        .map(argument =>
            replaceArgumentVariables(
                argument,
                values
            )
        );
}


/*
 * ============================================================
 * LOAD VERSION PROFILE
 * ============================================================
 */

async function loadVersionProfile(
    instanceDirectory,
    version,
    installation
) {
    /*
     * Prefer the launchVersion saved by the installer.
     *
     * Fabric example:
     *
     * fabric-loader-0.19.3-1.21.11
     */

    const possibleVersions = [];

    if (
        installation?.launchVersion
    ) {
        possibleVersions.push(
            installation.launchVersion
        );
    }

    if (
        installation?.profile
    ) {
        possibleVersions.push(
            installation.profile
        );
    }

    if (version) {
        possibleVersions.push(
            version
        );
    }


    /*
     * Remove duplicates.
     */

    const uniqueVersions = [
        ...new Set(
            possibleVersions.filter(Boolean)
        )
    ];


    for (
        const profileVersion of uniqueVersions
    ) {
        const versionFile =
            path.join(
                instanceDirectory,
                "versions",
                profileVersion,
                `${profileVersion}.json`
            );

        try {

            const raw =
                await fs.readFile(
                    versionFile,
                    "utf8"
                );

            const data =
                JSON.parse(raw);

            return {
                data,
                launchVersion:
                    profileVersion
            };

        } catch {
            /*
             * Try the next possible profile.
             */
        }
    }


    throw new Error(
        `Minecraft launch profile was not found for ${version}.`
    );
}


/*
 * ============================================================
 * LAUNCH MINECRAFT
 * ============================================================
 */

export async function launchMinecraft({
    instanceDirectory,
    version,
    loader = "vanilla",
    username = "NovexPlayer",
    uuid =
        "00000000-0000-0000-0000-000000000000",
    accessToken = "0",
    userType = "msa",
    onLog,
    onState
}) {

    if (minecraftProcess) {
        throw new Error(
            "Minecraft is already running."
        );
    }

    if (!instanceDirectory) {
        throw new Error(
            "Minecraft instance directory is required."
        );
    }

    if (!version) {
        throw new Error(
            "Minecraft version is required."
        );
    }


    /*
     * ========================================================
     * INSTALLATION INFO
     * ========================================================
     */

    const installation =
        await readInstallationInfo(
            instanceDirectory
        );


    /*
     * The installation file is optional for
     * vanilla, but recommended.
     */

    const installedMinecraftVersion =
        installation?.minecraftVersion ||
        version;

    const installedLoader =
        installation?.loader ||
        loader ||
        "vanilla";


    /*
     * ========================================================
     * LOAD CORRECT PROFILE
     * ========================================================
     */

    const {
        data: versionData,
        launchVersion
    } =
        await loadVersionProfile(
            instanceDirectory,
            installedMinecraftVersion,
            installation
        );


    /*
     * ========================================================
     * CLASSPATH
     * ========================================================
     */

    const classpath =
        await buildClasspath(
            instanceDirectory,
            versionData
        );


    /*
     * ========================================================
     * DIRECTORIES
     * ========================================================
     */

    const nativesDirectory =
        path.join(
            instanceDirectory,
            "natives"
        );

    const assetsDirectory =
        path.join(
            instanceDirectory,
            "assets"
        );


    /*
     * ========================================================
     * MINECRAFT VARIABLES
     * ========================================================
     */

    const argumentValues = {

        auth_player_name:
            username,

        version_name:
            versionData.id ||
            launchVersion,

        game_directory:
            instanceDirectory,

        assets_root:
            assetsDirectory,

        assets_index_name:
            versionData.assetIndex?.id ||
            "",

        auth_uuid:
            uuid,

        auth_access_token:
            accessToken,

        user_type:
            userType,

        version_type:
            versionData.type ||
            "release"

    };


    /*
     * ========================================================
     * JVM ARGUMENTS
     * ========================================================
     */

    let jvmArguments = [];


    if (
        Array.isArray(
            versionData.arguments?.jvm
        )
    ) {

        jvmArguments.push(
            ...parseMinecraftArguments(
                versionData.arguments.jvm,
                argumentValues
            )
        );
    }


    /*
     * Native library path.
     */

    jvmArguments.push(
        `-Djava.library.path=${nativesDirectory}`
    );


    /*
     * Novex memory settings.
     */

    jvmArguments.push(
        "-Xms1G"
    );

    jvmArguments.push(
        "-Xmx4G"
    );


    /*
     * Classpath.
     */

    jvmArguments.push(
        "-cp"
    );

    jvmArguments.push(
        classpath
    );


    /*
     * ========================================================
     * MAIN CLASS
     * ========================================================
     */

    const mainClass =
        versionData.mainClass;

    if (!mainClass) {
        throw new Error(
            `Minecraft ${installedMinecraftVersion} does not specify a main class.`
        );
    }


    /*
     * ========================================================
     * GAME ARGUMENTS
     * ========================================================
     */

    let gameArguments = [];


    /*
     * Modern Minecraft.

     */

    if (
        Array.isArray(
            versionData.arguments?.game
        )
    ) {

        gameArguments.push(
            ...parseMinecraftArguments(
                versionData.arguments.game,
                argumentValues
            )
        );
    }


    /*
     * Legacy Minecraft.
     */

    if (
        gameArguments.length === 0 &&
        versionData.minecraftArguments
    ) {

        gameArguments =
            parseLegacyGameArguments(
                versionData.minecraftArguments,
                argumentValues
            );
    }


    /*
     * ========================================================
     * QUICK PLAY FIX
     * ========================================================
     */

    gameArguments =
        removeDuplicateQuickPlayArguments(
            gameArguments
        );


    /*
     * ========================================================
     * FALLBACK GAME ARGUMENTS
     * ========================================================
     */

    if (
        !gameArguments.includes(
            "--gameDir"
        )
    ) {

        gameArguments.push(
            "--gameDir",
            instanceDirectory
        );
    }


    if (
        !gameArguments.includes(
            "--assetsDir"
        )
    ) {

        gameArguments.push(
            "--assetsDir",
            assetsDirectory
        );
    }


    if (
        !gameArguments.includes(
            "--assetIndex"
        ) &&
        versionData.assetIndex?.id
    ) {

        gameArguments.push(
            "--assetIndex",
            versionData.assetIndex.id
        );
    }


    if (
        !gameArguments.includes(
            "--username"
        )
    ) {

        gameArguments.push(
            "--username",
            username
        );
    }


    if (
        !gameArguments.includes(
            "--uuid"
        )
    ) {

        gameArguments.push(
            "--uuid",
            uuid
        );
    }


    if (
        !gameArguments.includes(
            "--accessToken"
        )
    ) {

        gameArguments.push(
            "--accessToken",
            accessToken
        );
    }


    /*
     * ========================================================
     * FINAL QUICK PLAY CLEANUP
     * ========================================================
     */

    gameArguments =
        removeDuplicateQuickPlayArguments(
            gameArguments
        );


    /*
     * ========================================================
     * FINAL JAVA COMMAND
     * ========================================================
     */

    const java =
        getJavaExecutable();

    const finalArguments = [

        ...jvmArguments,

        mainClass,

        ...gameArguments

    ];


    /*
     * ========================================================
     * LOGGING
     * ========================================================
     */

    onState?.(
        "starting"
    );

    onLog?.(
        "[Novex] Starting Minecraft..."
    );

    onLog?.(
        `[Novex] Minecraft: ${installedMinecraftVersion}`
    );

    onLog?.(
        `[Novex] Loader: ${installedLoader}`
    );

    onLog?.(
        `[Novex] Launch profile: ${launchVersion}`
    );

    onLog?.(
        `[Novex] Main class: ${mainClass}`
    );

    onLog?.(
        `[Novex] Java: ${java}`
    );

    onLog?.(
        `[Novex] Classpath entries: ${
            classpath.split(
                process.platform === "win32"
                    ? ";"
                    : ":"
            ).length
        }`
    );


    /*
     * ========================================================
     * SPAWN
     * ========================================================
     */

    minecraftProcess =
        spawn(
            java,
            finalArguments,
            {
                cwd:
                    instanceDirectory,

                windowsHide:
                    true,

                stdio: [
                    "pipe",
                    "pipe",
                    "pipe"
                ]
            }
        );


    /*
     * ========================================================
     * STDOUT
     * ========================================================
     */

    minecraftProcess.stdout.on(
        "data",
        data => {

            onLog?.(
                data.toString()
            );

        }
    );


    /*
     * ========================================================
     * STDERR
     * ========================================================
     */

    minecraftProcess.stderr.on(
        "data",
        data => {

            onLog?.(
                data.toString()
            );

        }
    );


    /*
     * ========================================================
     * PROCESS STARTED
     * ========================================================
     */

    minecraftProcess.on(
        "spawn",
        () => {

            onState?.(
                "running"
            );

            onLog?.(
                "[Novex] Minecraft process started."
            );

        }
    );


    /*
     * ========================================================
     * PROCESS ERROR
     * ========================================================
     */

    minecraftProcess.on(
        "error",
        error => {

            onLog?.(
                `[Novex] Failed to start Minecraft: ${error.message}`
            );

            onState?.(
                "crashed"
            );

            minecraftProcess = null;

        }
    );


    /*
     * ========================================================
     * PROCESS CLOSED
     * ========================================================
 */

    minecraftProcess.on(
        "close",
        code => {

            if (code === 0) {

                onLog?.(
                    "[Novex] Minecraft closed normally."
                );

                onState?.(
                    "stopped"
                );

            } else {

                onLog?.(
                    `[Novex] Minecraft exited with code ${code}.`
                );

                onState?.(
                    "crashed"
                );

            }

            minecraftProcess = null;

        }
    );


    return true;
}


/*
 * ============================================================
 * STOP MINECRAFT
 * ============================================================
 */

export function stopMinecraft(
    onLog,
    onState
) {

    if (!minecraftProcess) {
        return false;
    }

    onState?.(
        "stopping"
    );

    onLog?.(
        "[Novex] Stopping Minecraft..."
    );


    if (
        process.platform === "win32"
    ) {

        spawn(
            "taskkill",
            [
                "/pid",
                String(
                    minecraftProcess.pid
                ),
                "/t",
                "/f"
            ],
            {
                windowsHide:
                    true
            }
        );

    } else {

        minecraftProcess.kill(
            "SIGTERM"
        );

    }


    return true;
}


/*
 * ============================================================
 * IS MINECRAFT RUNNING
 * ============================================================
 */

export function isMinecraftRunning() {
    return minecraftProcess !== null;
}