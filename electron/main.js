import {
    app,
    BrowserWindow,
    ipcMain,
    shell
} from "electron";

import {
    launchMinecraft,
    stopMinecraft,
    isMinecraftRunning
} from "./minecraftLauncher.js";

import path from "path";
import { fileURLToPath } from "url";

import {
    createInstanceDirectory,
    deleteInstanceDirectory,
    getInstanceDirectory
} from "./instanceManager.js";

import {
    installMinecraft,
    cancelMinecraftInstall
} from "./minecraftInstaller.js";

import {
    listFiles,
    createFolder,
    deletePath,
    renamePath,
    readText,
    writeText
} from "./fileManager.js";

import {
    installMod,
    installFavorites,
    installModpack,
    installResourcePack
} from "./modrinthManager.js";


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


/*
 * MINECRAFT CONSOLE WINDOW
 */

let consoleWindow = null;


/*
 * ESCAPE HTML
 */

function escapeHtml(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character])
    );

}


/*
 * CREATE MINECRAFT CONSOLE
 */

function createConsoleWindow(
    instanceName = "Minecraft"
) {

    if (
        consoleWindow &&
        !consoleWindow.isDestroyed()
    ) {

        consoleWindow.focus();

        consoleWindow.webContents
            .executeJavaScript(
                `window.novexConsole?.setInstance(${JSON.stringify(
                    String(instanceName)
                )})`
            )
            .catch(() => {});

        return consoleWindow;

    }


    consoleWindow =
        new BrowserWindow({

            width: 980,

            height: 620,

            minWidth: 700,

            minHeight: 420,

            title:
                `Minecraft Console — ${instanceName}`,

            backgroundColor:
                "#090a0b",

            autoHideMenuBar:
                true,

            webPreferences: {

                contextIsolation:
                    true,

                nodeIntegration:
                    false,

                sandbox:
                    true

            }

        });


    const html =
        `<!doctype html>

<html>

<head>

<meta charset="UTF-8">

<title>
Minecraft Console
</title>

<style>

* {
    box-sizing: border-box;
}

html,
body {

    width: 100%;

    height: 100%;

    margin: 0;

    background: #090a0b;

    color: #e7e8ea;

    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    overflow: hidden;

}

body {

    display: flex;

    flex-direction: column;

}

.header {

    height: 68px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    padding: 0 18px;

    border-bottom:
        1px solid #24272b;

    background:
        #101214;

}

.eyebrow {

    font-size: 9px;

    font-weight: 800;

    letter-spacing: .16em;

    color: #666b72;

    text-transform: uppercase;

}

.title {

    margin-top: 3px;

    font-size: 14px;

    font-weight: 750;

}

.actions {

    display: flex;

    gap: 7px;

}

.actions button {

    border:
        1px solid #30343a;

    background:
        #181a1d;

    color:
        #cfd1d4;

    border-radius:
        8px;

    padding:
        8px 11px;

    cursor:
        pointer;

}

.actions button:hover {

    background:
        #202328;

}

.output {

    flex: 1;

    overflow:
        auto;

    padding:
        14px 16px;

    font:
        12px/1.55
        Consolas,
        "Cascadia Mono",
        "Courier New",
        monospace;

    white-space:
        pre-wrap;

    word-break:
        break-word;

    background:
        #070809;

}

.line {

    display:
        block;

}

.normal {

    color:
        #c5c8cc;

}

.warn {

    color:
        #d0bd7c;

}

.error {

    color:
        #df8f8f;

}

.empty {

    color:
        #555a60;

}

.footer {

    height:
        45px;

    display:
        flex;

    align-items:
        center;

    gap:
        12px;

    padding:
        0 16px;

    border-top:
        1px solid #24272b;

    background:
        #101214;

    color:
        #656a70;

    font-size:
        10px;

}

.footer label {

    display:
        flex;

    gap:
        6px;

    align-items:
        center;

}

.count {

    margin-left:
        auto;

}

.output::-webkit-scrollbar {

    width:
        8px;

}

.output::-webkit-scrollbar-thumb {

    background:
        #30343a;

    border-radius:
        99px;

}

</style>

</head>

<body>

<header class="header">

<div>

<div class="eyebrow">

NOVEX CLIENT

</div>

<div
    class="title"
    id="instance"
>

${escapeHtml(instanceName)}

</div>

</div>

<div class="actions">

<button id="clear">

Clear

</button>

<button id="copy">

Copy

</button>

</div>

</header>

<main
    id="output"
    class="output"
>

<span
    id="empty"
    class="empty"
>

Waiting for Minecraft output...

</span>

</main>

<footer class="footer">

<label>

<input
    id="auto"
    type="checkbox"
    checked
>

Auto-scroll

</label>

<span
    id="count"
    class="count"
>

0 lines

</span>

</footer>

<script>

const output =
    document.getElementById("output");

const empty =
    document.getElementById("empty");

const count =
    document.getElementById("count");

const auto =
    document.getElementById("auto");

const instance =
    document.getElementById("instance");

let lines = [];


function add(message) {

    if (empty) {
        empty.remove();
    }

    const parts =
        String(message)
            .split(/(?<=\\\\n)/);

    for (
        const text of parts
    ) {

        if (!text) {
            continue;
        }

        const span =
            document.createElement(
                "span"
            );

        span.className =
            "line " +
            (
                /error|exception|fatal/i
                    .test(text)
                    ? "error"
                    : /warn/i.test(text)
                        ? "warn"
                        : "normal"
            );

        span.textContent =
            text;

        output.appendChild(
            span
        );

        lines.push(text);

    }

    count.textContent =
        lines.length +
        " lines";

    if (
        auto.checked
    ) {

        output.scrollTop =
            output.scrollHeight;

    }

}


document
    .getElementById("clear")
    .onclick = () => {

        lines = [];

        output.innerHTML =
            "";

        count.textContent =
            "0 lines";

    };


document
    .getElementById("copy")
    .onclick = async () => {

        try {

            await navigator.clipboard.writeText(
                lines.join("")
            );

        } catch {}

    };


window.novexConsole = {

    add,

    setInstance:
        name => {

            instance.textContent =
                name;

            document.title =
                "Minecraft Console — " +
                name;

        }

};

</script>

</body>

</html>`;


    consoleWindow.loadURL(
        `data:text/html;charset=UTF-8,${encodeURIComponent(
            html
        )}`
    );


    consoleWindow.on(
        "closed",
        () => {

            consoleWindow =
                null;

            const main =
                BrowserWindow
                    .getAllWindows()
                    .find(
                        window =>
                            !window.isDestroyed()
                    );

            if (
                main &&
                !main.isDestroyed()
            ) {

                main.webContents.send(
                    "minecraft:console-closed"
                );

            }

        }
    );


    return consoleWindow;

}


/*
 * SEND LOG TO MINECRAFT CONSOLE
 */

function sendConsoleLog(
    message
) {

    if (
        consoleWindow &&
        !consoleWindow.isDestroyed()
    ) {

        consoleWindow.webContents
            .executeJavaScript(
                `window.novexConsole?.add(${JSON.stringify(
                    String(message)
                )})`
            )
            .catch(() => {});

    }

}


/*
 * CREATE MAIN WINDOW
 */

function createWindow() {

    const win =
        new BrowserWindow({

            width: 1200,

            height: 750,

            icon:
                path.join(
                    __dirname,
                    "../public/novex.ico"
                ),

            webPreferences: {

                preload:
                    path.join(
                        __dirname,
                        "preload.js"
                    ),

                contextIsolation:
                    true,

                nodeIntegration:
                    false,

                /*
                 * Required for our
                 * Electron setup.
                 */

                sandbox:
                    false

            }

        });


    /*
     * Remove Electron's default
     * File / Edit / View / Window / Help menu.
     */

    win.removeMenu();


    if (app.isPackaged) {

        win.loadFile(

            path.join(
                __dirname,
                "../dist/index.html"
            )

        );

    } else {

        win.loadURL(
            "http://localhost:5173"
        );

        win.webContents.openDevTools();

    }

}


/*
 * CREATE INSTANCE
 */

ipcMain.handle(

    "instances:create",

    async (
        _event,
        instance
    ) => {

        return await createInstanceDirectory(
            instance
        );

    }

);


/*
 * DELETE INSTANCE
 */

ipcMain.handle(

    "instances:delete",

    async (
        _event,
        instance
    ) => {

        await deleteInstanceDirectory(
            instance
        );

        return true;

    }

);


/*
 * GET INSTANCE DIRECTORY
 */

ipcMain.handle(

    "instances:getDirectory",

    async (
        _event,
        instance
    ) => {

        return getInstanceDirectory(
            instance
        );

    }

);


/*
 * OPEN INSTANCE FOLDER
 */

ipcMain.handle(

    "instances:openFolder",

    async (
        _event,
        instance
    ) => {

        const directory =
            await getInstanceDirectory(
                instance
            );


        const error =
            await shell.openPath(
                directory
            );


        if (error) {

            throw new Error(
                error
            );

        }


        return true;

    }

);


/*
 * OPEN MINECRAFT CONSOLE
 */

ipcMain.handle(

    "minecraft:console-open",

    async (
        _event,
        instanceName
    ) => {

        createConsoleWindow(
            instanceName ||
            "Minecraft"
        );

        return true;

    }

);


/*
 * CLOSE MINECRAFT CONSOLE
 */

ipcMain.handle(

    "minecraft:console-close",

    () => {

        if (
            consoleWindow &&
            !consoleWindow.isDestroyed()
        ) {

            consoleWindow.close();

        }

        return true;

    }

);


/*
 * INSTALL MINECRAFT
 */

ipcMain.handle(

    "minecraft:install",

    async (
        event,
        options
    ) => {

        const window =
            BrowserWindow.fromWebContents(
                event.sender
            );


        return await installMinecraft({

            ...options,

            onProgress:
                progress => {

                    sendInstallProgress(
                        window,
                        progress
                    );

                }

        });

    }

);


/*
 * SEND INSTALLATION PROGRESS
 * ELECTRON → REACT
 */

function sendInstallProgress(

    window,

    progress

) {

    if (

        window &&
        !window.isDestroyed()

    ) {

        window.webContents.send(

            "minecraft:install-progress",

            progress

        );

    }

}


/*
 * LAUNCH MINECRAFT
 */

ipcMain.handle(

    "minecraft:launch",

    async (
        event,
        options
    ) => {

        const window =
            BrowserWindow.fromWebContents(
                event.sender
            );


        return await launchMinecraft({

            ...options,


            onLog:
                message => {

                    if (

                        window &&
                        !window.isDestroyed()

                    ) {

                        window.webContents.send(

                            "minecraft:log",

                            message

                        );

                    }


                    /*
                     * Also send the log
                     * to the separate
                     * Minecraft console.
                     */

                    sendConsoleLog(
                        message
                    );

                },


            onState:
                state => {

                    if (

                        window &&
                        !window.isDestroyed()

                    ) {

                        window.webContents.send(

                            "minecraft:state",

                            state

                        );

                    }

                }

        });

    }

);


/*
 * STOP MINECRAFT
 */

ipcMain.handle(

    "minecraft:stop",

    async (
        event
    ) => {

        const window =
            BrowserWindow.fromWebContents(
                event.sender
            );


        return stopMinecraft(

            message => {

                if (

                    window &&
                    !window.isDestroyed()

                ) {

                    window.webContents.send(

                        "minecraft:log",

                        message

                    );

                }


                /*
                 * Keep the console updated
                 * while Minecraft is stopping.
                 */

                sendConsoleLog(
                    message
                );

            },


            state => {

                if (

                    window &&
                    !window.isDestroyed()

                ) {

                    window.webContents.send(

                        "minecraft:state",

                        state

                    );

                }

            }

        );

    }

);


/*
 * CANCEL MINECRAFT INSTALLATION
 */

ipcMain.handle(

    "minecraft:cancel-install",

    () => {

        return cancelMinecraftInstall();

    }

);


/*
 * CHECK IF MINECRAFT IS RUNNING
 */

ipcMain.handle(

    "minecraft:is-running",

    () => {

        return isMinecraftRunning();

    }

);


/*
 * FILE MANAGER
 */

ipcMain.handle(

    "files:list",

    async (
        _event,
        instance,
        relativePath = ""
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        return listFiles(
            root,
            relativePath
        );

    }

);


ipcMain.handle(

    "files:createFolder",

    async (
        _event,
        instance,
        relativePath
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        await createFolder(
            root,
            relativePath
        );


        return true;

    }

);


ipcMain.handle(

    "files:delete",

    async (
        _event,
        instance,
        relativePath
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        await deletePath(
            root,
            relativePath
        );


        return true;

    }

);


ipcMain.handle(

    "files:rename",

    async (
        _event,
        instance,
        relativePath,
        newName
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        await renamePath(
            root,
            relativePath,
            newName
        );


        return true;

    }

);


ipcMain.handle(

    "files:readText",

    async (
        _event,
        instance,
        relativePath
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        return readText(
            root,
            relativePath
        );

    }

);


ipcMain.handle(

    "files:writeText",

    async (
        _event,
        instance,
        relativePath,
        content
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        await writeText(
            root,
            relativePath,
            content
        );


        return true;

    }

);


/*
 * MODRINTH MOD INSTALLATION
 */

ipcMain.handle(

    "mods:install",

    async (
        _event,
        instance,
        projectId,
        versionId
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        return installMod({

            instanceDirectory:
                root,

            projectId,

            versionId,

            gameVersion:
                instance.minecraftVersion,

            loader:
                instance.loader

        });

    }

);


/*
 * INSTALL FAVORITE MODS
 */

ipcMain.handle(

    "mods:installFavorites",

    async (
        _event,
        instance,
        projectIds
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        return installFavorites({

            instanceDirectory:
                root,

            gameVersion:
                instance.minecraftVersion,

            loader:
                instance.loader,

            projectIds

        });

    }

);


/*
 * MODPACK INSTALLATION
 */

ipcMain.handle(

    "modpacks:install",

    async (
        _event,
        instance,
        projectId,
        versionId
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        return installModpack({

            instanceDirectory:
                root,

            projectId,

            versionId

        });

    }

);


/*
 * RESOURCE PACK INSTALLATION
 */

ipcMain.handle(

    "resourcepacks:install",

    async (
        _event,
        instance,
        projectId,
        versionId
    ) => {

        const root =
            await getInstanceDirectory(
                instance
            );


        return installResourcePack({

            instanceDirectory:
                root,

            projectId,

            versionId,

            gameVersion:
                instance.minecraftVersion

        });

    }

);


/*
 * APP READY
 */

app.whenReady().then(() => {

    createWindow();


    app.on(

        "activate",

        () => {

            if (

                BrowserWindow
                    .getAllWindows()
                    .length === 0

            ) {

                createWindow();

            }

        }

    );

});


/*
 * CLOSE APP
 */

app.on(

    "window-all-closed",

    () => {

        if (
            process.platform !== "darwin"
        ) {

            app.quit();

        }

    }

);