import type {
    MinecraftInstance
} from "../services/instances";


type MinecraftInstallProgress = {

    stage: string;

    current: number;

    total: number;

    message: string;

};


type MinecraftState =

    | "starting"
    | "running"
    | "stopping"
    | "stopped"
    | "crashed";


type MinecraftInstallResult = {

    version: string;

    instanceDirectory: string;

    loader?: string;

    loaderVersion?: string;

};


type NovexFile = {

    name: string;

    path: string;

    type:
        | "file"
        | "directory";

    size: number;

    modified: number;

};


declare global {

    interface Window {

        novex: {

            version: string;


            /*
             * INSTANCES
             */

            instances: {

                create(
                    instance:
                        MinecraftInstance
                ): Promise<string>;

                delete(
                    instance:
                        MinecraftInstance
                ): Promise<boolean>;

                getDirectory(
                    instance:
                        MinecraftInstance
                ): Promise<string>;

                openFolder(
                    instance:
                        MinecraftInstance
                ): Promise<boolean>;

            };


            /*
             * FILE MANAGER
             */

            files: {

                list(

                    instance:
                        MinecraftInstance,

                    relativePath?:
                        string

                ): Promise<
                    NovexFile[]
                >;


                createFolder(

                    instance:
                        MinecraftInstance,

                    relativePath:
                        string

                ): Promise<boolean>;


                delete(

                    instance:
                        MinecraftInstance,

                    relativePath:
                        string

                ): Promise<boolean>;


                rename(

                    instance:
                        MinecraftInstance,

                    relativePath:
                        string,

                    newName:
                        string

                ): Promise<boolean>;


                readText(

                    instance:
                        MinecraftInstance,

                    relativePath:
                        string

                ): Promise<string>;


                writeText(

                    instance:
                        MinecraftInstance,

                    relativePath:
                        string,

                    content:
                        string

                ): Promise<boolean>;

            };


            /*
             * MODS
             */

            mods: {

                install(

                    instance:
                        MinecraftInstance,

                    projectId:
                        string,

                    versionId:
                        string

                ): Promise<boolean>;


                installFavorites(

                    instance:
                        MinecraftInstance,

                    projectIds:
                        string[]

                ): Promise<boolean>;

            };


            /*
             * MODPACKS
             */

            modpacks: {

                install(

                    instance:
                        MinecraftInstance,

                    projectId:
                        string,

                    versionId:
                        string

                ): Promise<{

                    projectId:
                        string;

                    versionId:
                        string;

                    name:
                        string;

                }>;

            };


            /*
             * RESOURCE PACKS
             */

            resourcepacks: {

                install(

                    instance:
                        MinecraftInstance,

                    projectId:
                        string,

                    versionId:
                        string

                ): Promise<boolean>;

            };


            /*
             * MINECRAFT
             */

            minecraft: {

                install(

                    options: {

                        version:
                            string;

                        loader:
                            MinecraftInstance["loader"];

                        loaderVersion?:
                            string;

                        instanceDirectory:
                            string;

                    }

                ): Promise<
                    MinecraftInstallResult
                >;


                cancelInstall():
                    Promise<boolean>;


                /*
                 * MINECRAFT CONSOLE
                 */

                openConsole(
                    instanceName:
                        string
                ): Promise<boolean>;


                closeConsole():
                    Promise<boolean>;


                onConsoleClosed(

                    callback: () => void

                ): () => void;


                /*
                 * INSTALL PROGRESS
                 */

                onInstallProgress(

                    callback: (

                        progress:
                            MinecraftInstallProgress

                    ) => void

                ): () => void;


                /*
                 * LAUNCH
                 */

                launch(

                    options: {

                        instanceDirectory:
                            string;

                        version:
                            string;

                        loader:
                            MinecraftInstance["loader"];

                        username?:
                            string;

                        uuid?:
                            string;

                        accessToken?:
                            string;

                    }

                ): Promise<boolean>;


                /*
                 * STOP
                 */

                stop():
                    Promise<boolean>;


                /*
                 * RUNNING CHECK
                 */

                isRunning():
                    Promise<boolean>;


                /*
                 * MINECRAFT LOGS
                 */

                onLog(

                    callback: (

                        message:
                            string

                    ) => void

                ): () => void;


                /*
                 * MINECRAFT STATE
                 */

                onState(

                    callback: (

                        state:
                            MinecraftState

                    ) => void

                ): () => void;

            };

        };

    }

}


export {};