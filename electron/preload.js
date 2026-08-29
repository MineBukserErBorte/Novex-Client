import {
    contextBridge,
    ipcRenderer
} from "electron";


contextBridge.exposeInMainWorld(
    "novex",
    {

        version: "0.1.0",


        /*
         * INSTANCES
         */

        instances: {

            create: instance =>
                ipcRenderer.invoke(
                    "instances:create",
                    instance
                ),

            delete: instance =>
                ipcRenderer.invoke(
                    "instances:delete",
                    instance
                ),

            getDirectory: instance =>
                ipcRenderer.invoke(
                    "instances:getDirectory",
                    instance
                ),

            openFolder: instance =>
                ipcRenderer.invoke(
                    "instances:openFolder",
                    instance
                )

        },


        /*
         * FILE MANAGER
         */

        files: {

            list: (
                instance,
                relativePath = ""
            ) =>
                ipcRenderer.invoke(
                    "files:list",
                    instance,
                    relativePath
                ),

            createFolder: (
                instance,
                relativePath
            ) =>
                ipcRenderer.invoke(
                    "files:createFolder",
                    instance,
                    relativePath
                ),

            delete: (
                instance,
                relativePath
            ) =>
                ipcRenderer.invoke(
                    "files:delete",
                    instance,
                    relativePath
                ),

            rename: (
                instance,
                relativePath,
                newName
            ) =>
                ipcRenderer.invoke(
                    "files:rename",
                    instance,
                    relativePath,
                    newName
                ),

            readText: (
                instance,
                relativePath
            ) =>
                ipcRenderer.invoke(
                    "files:readText",
                    instance,
                    relativePath
                ),

            writeText: (
                instance,
                relativePath,
                content
            ) =>
                ipcRenderer.invoke(
                    "files:writeText",
                    instance,
                    relativePath,
                    content
                )

        },


        /*
         * MODS
         */

        mods: {

            install: (
                instance,
                projectId,
                versionId
            ) =>
                ipcRenderer.invoke(
                    "mods:install",
                    instance,
                    projectId,
                    versionId
                ),

            installFavorites: (
                instance,
                projectIds
            ) =>
                ipcRenderer.invoke(
                    "mods:installFavorites",
                    instance,
                    projectIds
                )

        },


        /*
         * MODPACKS
         */

        modpacks: {

            install: (
                instance,
                projectId,
                versionId
            ) =>
                ipcRenderer.invoke(
                    "modpacks:install",
                    instance,
                    projectId,
                    versionId
                )

        },


        /*
         * RESOURCE PACKS
         */

        resourcepacks: {

            install: (
                instance,
                projectId,
                versionId
            ) =>
                ipcRenderer.invoke(
                    "resourcepacks:install",
                    instance,
                    projectId,
                    versionId
                )

        },


        /*
         * MINECRAFT
         */

        minecraft: {

            install: options =>
                ipcRenderer.invoke(
                    "minecraft:install",
                    options
                ),

            cancelInstall: () =>
                ipcRenderer.invoke(
                    "minecraft:cancel-install"
                ),

            launch: options =>
                ipcRenderer.invoke(
                    "minecraft:launch",
                    options
                ),

            stop: () =>
                ipcRenderer.invoke(
                    "minecraft:stop"
                ),

            isRunning: () =>
                ipcRenderer.invoke(
                    "minecraft:is-running"
                ),


            /*
             * MINECRAFT CONSOLE
             */

            openConsole: instanceName =>
                ipcRenderer.invoke(
                    "minecraft:console-open",
                    instanceName
                ),

            closeConsole: () =>
                ipcRenderer.invoke(
                    "minecraft:console-close"
                ),

            onConsoleClosed: callback => {

                const listener = () => {

                    callback();

                };

                ipcRenderer.on(
                    "minecraft:console-closed",
                    listener
                );

                return () => {

                    ipcRenderer.removeListener(
                        "minecraft:console-closed",
                        listener
                    );

                };

            },


            /*
             * INSTALL PROGRESS
             */

            onInstallProgress: callback => {

                const listener = (
                    _event,
                    progress
                ) => {

                    callback(progress);

                };

                ipcRenderer.on(
                    "minecraft:install-progress",
                    listener
                );

                return () => {

                    ipcRenderer.removeListener(
                        "minecraft:install-progress",
                        listener
                    );

                };

            },


            /*
             * MINECRAFT LOGS
             */

            onLog: callback => {

                const listener = (
                    _event,
                    message
                ) => {

                    callback(message);

                };

                ipcRenderer.on(
                    "minecraft:log",
                    listener
                );

                return () => {

                    ipcRenderer.removeListener(
                        "minecraft:log",
                        listener
                    );

                };

            },


            /*
             * MINECRAFT STATE
             */

            onState: callback => {

                const listener = (
                    _event,
                    state
                ) => {

                    callback(state);

                };

                ipcRenderer.on(
                    "minecraft:state",
                    listener
                );

                return () => {

                    ipcRenderer.removeListener(
                        "minecraft:state",
                        listener
                    );

                };

            }

        }

    }
);