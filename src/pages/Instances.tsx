import {
    useEffect,
    useState,
    type ChangeEvent
} from "react";

import MinecraftConsole from "../components/MinecraftConsole";

import {
    createInstance,
    deleteInstance,
    updateInstance,
    type MinecraftInstance,
    type ModLoader
} from "../services/instances";

import {
    getMinecraftVersions,
    getRecommendedVersions,
    type MinecraftVersion
} from "../services/minecraft";


type InstallProgress = {
    stage: string;
    current: number;
    total: number;
    message: string;
};


type MinecraftInstallOptions = {
    version: string;
    instanceDirectory: string;
    loader?: ModLoader;
    loaderVersion?: string;
};


type MinecraftInstallResult = {
    version: string;
    instanceDirectory: string;
    loader?: ModLoader;
    loaderVersion?: string;
    launchVersion?: string;
};


type InstancesProps = {
    instances: MinecraftInstance[];
    onInstancesChanged: () => void;
    onEditInstance?: (instance: MinecraftInstance) => void;
};


function Instances({
    instances,
    onInstancesChanged,
    onEditInstance
}: InstancesProps) {

    const [runningInstanceId, setRunningInstanceId] =
        useState<string | null>(null);

    const [instanceStates, setInstanceStates] =
        useState<Record<string, string>>({});

    const [consoleInstance, setConsoleInstance] =
        useState<MinecraftInstance | null>(null);

    const [versions, setVersions] =
        useState<MinecraftVersion[]>([]);

    const [loadingVersions, setLoadingVersions] =
        useState(true);

    const [versionError, setVersionError] =
        useState("");

    const [showCreate, setShowCreate] =
        useState(false);

    const [editing, setEditing] =
        useState<MinecraftInstance | null>(null);

    const [deleting, setDeleting] =
        useState<MinecraftInstance | null>(null);

    const [installing, setInstalling] =
        useState<MinecraftInstance | null>(null);

    const [installProgress, setInstallProgress] =
        useState<InstallProgress | null>(null);

    const [installError, setInstallError] =
        useState("");

    const [name, setName] =
        useState("");

    const [minecraftVersion, setMinecraftVersion] =
        useState("");

    const [loader, setLoader] =
        useState<ModLoader>("vanilla");

    const [icon, setIcon] =
        useState<string | undefined>();


    /*
     * ============================================================
     * LOAD MINECRAFT VERSIONS
     * ============================================================
     */

    useEffect(() => {

        async function loadVersions() {

            try {

                setLoadingVersions(true);
                setVersionError("");

                const allVersions =
                    await getMinecraftVersions();

                const supportedVersions =
                    getRecommendedVersions(allVersions);

                setVersions(
                    supportedVersions
                );

                if (
                    supportedVersions.length > 0 &&
                    !minecraftVersion
                ) {

                    setMinecraftVersion(
                        supportedVersions[0].id
                    );

                }

            } catch (error) {

                console.error(
                    "Failed to load Minecraft versions:",
                    error
                );

                setVersionError(
                    "Could not load Minecraft versions."
                );

            } finally {

                setLoadingVersions(false);

            }

        }

        loadVersions();

    }, []);


    /*
     * ============================================================
     * INSTALLATION PROGRESS
     * ============================================================
     */

    useEffect(() => {

        if (
            !window.novex?.minecraft?.onInstallProgress
        ) {

            return;

        }

        const cleanup =
            window.novex.minecraft.onInstallProgress(
                (progress: InstallProgress) => {

                    setInstallProgress(
                        progress
                    );

                }
            );

        return cleanup;

    }, []);


    /*
     * ============================================================
     * MINECRAFT STATE
     * ============================================================
     */

    useEffect(() => {

        if (
            !window.novex?.minecraft?.onState
        ) {

            return;

        }

        const cleanup =
            window.novex.minecraft.onState(
                (state: string) => {

                    setInstanceStates(
                        current => {

                            if (!runningInstanceId) {
                                return current;
                            }

                            return {
                                ...current,

                                [runningInstanceId]:
                                    state
                            };

                        }
                    );


                    if (
                        state === "stopped" ||
                        state === "crashed"
                    ) {

                        setRunningInstanceId(
                            null
                        );

                        setConsoleInstance(
                            null
                        );

                    }

                }
            );

        return cleanup;

    }, [runningInstanceId]);


    /*
     * ============================================================
     * OPEN CREATE
     * ============================================================
     */

    function openCreate() {

        setEditing(null);

        setName("");

        setLoader("vanilla");

        setIcon(undefined);

        if (
            versions.length > 0
        ) {

            setMinecraftVersion(
                versions[0].id
            );

        }

        setInstallError("");

        setShowCreate(true);

    }


    /*
     * ============================================================
     * OPEN EDIT
     * ============================================================
     */

    function openEdit(
        instance: MinecraftInstance
    ) {

        setEditing(
            instance
        );

        setName(
            instance.name
        );

        setMinecraftVersion(
            instance.minecraftVersion
        );

        setLoader(
            instance.loader
        );

        setIcon(
            instance.icon
        );

        setInstallError("");

        setShowCreate(true);

    }


    /*
     * ============================================================
     * ICON UPLOAD
     * ============================================================
     */

    function handleIconUpload(
        event: ChangeEvent<HTMLInputElement>
    ) {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith("image/")
        ) {

            alert(
                "Please select an image file."
            );

            return;

        }

        const reader =
            new FileReader();

        reader.onload = () => {

            setIcon(
                reader.result as string
            );

        };

        reader.readAsDataURL(file);

    }


    /*
     * ============================================================
     * SAVE INSTANCE
     * ============================================================
     */

    async function handleSave() {

        if (
            !name.trim()
        ) {

            alert(
                "Please enter an instance name."
            );

            return;

        }

        if (
            !minecraftVersion
        ) {

            alert(
                "Please select a Minecraft version."
            );

            return;

        }


        /*
         * Forge and NeoForge are currently disabled.
         */

        if (
            loader === "forge" ||
            loader === "neoforge"
        ) {

            alert(
                `${formatLoader(loader)} installation is not available yet.`
            );

            return;

        }


        /*
         * ========================================================
         * EDIT EXISTING INSTANCE
         * ========================================================
         */

        if (
            editing
        ) {

            const versionChanged =
                editing.minecraftVersion !==
                minecraftVersion;

            const loaderChanged =
                editing.loader !==
                loader;


            const updated =
                updateInstance(
                    editing.id,
                    {
                        name:
                            name.trim(),

                        minecraftVersion,

                        loader,

                        icon
                    }
                );


            if (
                !updated
            ) {

                alert(
                    "Could not update the instance."
                );

                return;

            }


            onInstancesChanged();

            setShowCreate(false);


            /*
             * Only the name/icon changed.
             * No reinstall is required.
             */

            if (
                !versionChanged &&
                !loaderChanged
            ) {

                return;

            }


            /*
             * Minecraft version or loader changed.
             * Reinstall into the same instance folder.
             */

            await startInstallation(
                updated
            );

            return;

        }


        /*
         * ========================================================
         * CREATE NEW INSTANCE
         * ========================================================
         */

        const instance =
            createInstance(
                name.trim(),
                minecraftVersion,
                loader,
                icon
            );


        try {

            const instanceDirectory =
                await window.novex
                    .instances
                    .create(
                        instance
                    );

            console.log(
                "Instance directory:",
                instanceDirectory
            );

        } catch (error) {

            console.error(
                "Failed to create instance directory:",
                error
            );

            deleteInstance(
                instance.id
            );

            alert(
                "Novex could not create the instance folder."
            );

            return;

        }


        onInstancesChanged();

        setShowCreate(false);


        await startInstallation(
            instance
        );

    }


    /*
     * ============================================================
     * INSTALL MINECRAFT
     * ============================================================
     */

    async function startInstallation(
        instance: MinecraftInstance
    ) {

        if (
            runningInstanceId
        ) {

            alert(
                "Stop Minecraft before installing or changing an instance."
            );

            return;

        }


        setInstalling(
            instance
        );

        setInstallError("");

        setInstallProgress({
            stage: "starting",
            current: 0,
            total: 1,
            message: "Starting installation..."
        });


        try {

            const directory =
                await window.novex
                    .instances
                    .getDirectory(
                        instance
                    );


            /*
             * Create the installer options.
             */

            const installOptions: MinecraftInstallOptions = {

                version:
                    instance.minecraftVersion,

                loader:
                    instance.loader,

                loaderVersion:
                    instance.loaderVersion,

                instanceDirectory:
                    directory

            };


            /*
             * The Electron declaration currently has an older
             * signature for minecraft.install.
             *
             * Cast the function itself so the full installer
             * options can be passed safely.
             */

            const installFunction =
                window.novex.minecraft.install as unknown as (
                    options: MinecraftInstallOptions
                ) => Promise<MinecraftInstallResult>;


            const result =
                await installFunction(
                    installOptions
                );


            /*
             * Save the loader version returned by the installer.
             */

            if (
                result &&
                result.loaderVersion &&
                result.loaderVersion !==
                    instance.loaderVersion
            ) {

                updateInstance(
                    instance.id,
                    {
                        loaderVersion:
                            result.loaderVersion
                    }
                );

                onInstancesChanged();

            }


            setInstallProgress({

                stage:
                    "complete",

                current:
                    1,

                total:
                    1,

                message:
                    "Minecraft installation complete."

            });


            setTimeout(() => {

                setInstalling(
                    null
                );

                setInstallProgress(
                    null
                );

            }, 1200);

        } catch (error) {

            if (
                error instanceof Error &&
                (
                    error.name === "AbortError" ||
                    error.message.toLowerCase().includes("aborted")
                )
            ) {

                setInstalling(null);
                setInstallProgress(null);
                setInstallError("");

                return;

            }


            console.error(
                "Minecraft installation failed:",
                error
            );

            setInstallError(
                error instanceof Error
                    ? error.message
                    : "Minecraft installation failed."
            );

        }

    }


    /*
     * ============================================================
     * PLAY MINECRAFT
     * ============================================================
     */

    async function handlePlay(
        instance: MinecraftInstance
    ) {

        if (
            runningInstanceId
        ) {

            return;

        }


        try {

            const directory =
                await window.novex
                    .instances
                    .getDirectory(
                        instance
                    );


            setRunningInstanceId(
                instance.id
            );


            setInstanceStates(
                current => ({
                    ...current,

                    [instance.id]:
                        "starting"
                })
            );


            await window.novex
                .minecraft
                .launch({

                    instanceDirectory:
                        directory,

                    version:
                        instance.minecraftVersion,

                    loader:
                        instance.loader,

                    username:
                        "NovexPlayer",

                    uuid:
                        "00000000-0000-0000-0000-000000000000",

                    accessToken:
                        "0"

                });

        } catch (error) {

            console.error(
                "Failed to launch Minecraft:",
                error
            );


            setInstanceStates(
                current => ({
                    ...current,

                    [instance.id]:
                        "crashed"
                })
            );


            setRunningInstanceId(
                null
            );

        }

    }


    /*
     * ============================================================
     * STOP MINECRAFT
     * ============================================================
     */

    async function handleStop(
        instance: MinecraftInstance
    ) {

        if (
            runningInstanceId !==
            instance.id
        ) {

            return;

        }


        try {

            setInstanceStates(
                current => ({
                    ...current,

                    [instance.id]:
                        "stopping"
                })
            );


            await window.novex
                .minecraft
                .stop();

        } catch (error) {

            console.error(
                "Failed to stop Minecraft:",
                error
            );

        }

    }


    /*
     * ============================================================
     * DELETE INSTANCE
     * ============================================================
     */

    async function confirmDelete() {

        if (
            !deleting
        ) {

            return;

        }


        if (
            runningInstanceId ===
            deleting.id
        ) {

            alert(
                "Stop Minecraft before deleting this instance."
            );

            return;

        }


        try {

            await window.novex
                .instances
                .delete(
                    deleting
                );

        } catch (error) {

            console.error(
                "Failed to delete instance:",
                error
            );

            alert(
                "Novex could not delete the instance folder."
            );

            return;

        }


        deleteInstance(
            deleting.id
        );

        onInstancesChanged();

        setDeleting(
            null
        );

    }


    /*
     * ============================================================
     * RENDER
     * ============================================================
     */

    return (

        <div className="page">

            {/* HEADER */}

            <div className="page-header">

                <div>

                    <div className="eyebrow">
                        NOVEX CLIENT
                    </div>

                    <h1>
                        Instances
                    </h1>

                    <p>
                        Manage your Minecraft installations.
                    </p>

                </div>


                <button
                    className="primary-button"
                    onClick={openCreate}
                    disabled={
                        !!runningInstanceId ||
                        !!installing
                    }
                >
                    Create Instance
                </button>

            </div>


            {/* VERSION ERROR */}

            {versionError && (

                <div className="version-warning">
                    {versionError}
                </div>

            )}


            {/* INSTANCES */}

            {instances.length === 0 ? (

                <div className="empty-card">

                    <div className="empty-icon">
                        +
                    </div>

                    <h3>
                        No instances
                    </h3>

                    <p>
                        Create your first Minecraft instance.
                    </p>

                    <button
                        className="primary-button"
                        onClick={openCreate}
                    >
                        Create Instance
                    </button>

                </div>

            ) : (

                <div className="instance-grid">

                    {instances.map(
                        instance => {

                            const state =
                                instanceStates[
                                    instance.id
                                ];

                            const isRunning =
                                runningInstanceId ===
                                instance.id;


                            const consoleDisabled =
                                !!installing ||
                                (
                                    !!runningInstanceId &&
                                    runningInstanceId !==
                                        instance.id
                                );


                            return (

                                <div
                                    className="instance-card"
                                    key={
                                        instance.id
                                    }
                                >

                                    {/* ICON */}

                                    {instance.icon ? (

                                        <img
                                            className="instance-icon-image"
                                            src={instance.icon}
                                            alt=""
                                        />

                                    ) : (

                                        <div className="instance-icon">
                                            MC
                                        </div>

                                    )}


                                    {/* INFO */}

                                    <div className="instance-info">

                                        <h3>
                                            {
                                                instance.name
                                            }
                                        </h3>

                                        <p>
                                            Minecraft{" "}
                                            {
                                                instance.minecraftVersion
                                            }
                                        </p>

                                        <span className="loader-badge">

                                            {
                                                formatLoader(
                                                    instance.loader
                                                )
                                            }

                                        </span>


                                        {instance.loaderVersion && (

                                            <p>
                                                Loader{" "}
                                                {
                                                    instance.loaderVersion
                                                }
                                            </p>

                                        )}


                                        {state && (

                                            <div
                                                className={
                                                    `instance-status instance-status-${state}`
                                                }
                                            >
                                                {
                                                    formatState(
                                                        state
                                                    )
                                                }
                                            </div>

                                        )}

                                    </div>


                                    {/* ACTIONS */}

                                    <div className="instance-actions">

                                        {isRunning ? (

                                            <button
                                                className="danger-button"
                                                onClick={() =>
                                                    handleStop(
                                                        instance
                                                    )
                                                }
                                            >
                                                Stop
                                            </button>

                                        ) : (

                                            <button
                                                className="primary-button"
                                                disabled={
                                                    !!runningInstanceId ||
                                                    !!installing
                                                }
                                                onClick={() =>
                                                    handlePlay(
                                                        instance
                                                    )
                                                }
                                            >
                                                Play
                                            </button>

                                        )}


                                        <button
                                            className="secondary-button"
                                            disabled={
                                                consoleDisabled
                                            }
                                            onClick={() =>
                                                setConsoleInstance(
                                                    instance
                                                )
                                            }
                                        >
                                            Console
                                        </button>


                                        <button
                                            className="secondary-button"
                                            disabled={
                                                !!installing ||
                                                (
                                                    !!runningInstanceId &&
                                                    runningInstanceId !==
                                                        instance.id
                                                )
                                            }
                                            onClick={() => {

                                                if (
                                                    onEditInstance
                                                ) {

                                                    onEditInstance(
                                                        instance
                                                    );

                                                } else {

                                                    openEdit(
                                                        instance
                                                    );

                                                }

                                            }}
                                        >
                                            Edit
                                        </button>


                                        <button
                                            className="danger-button"
                                            disabled={
                                                !!runningInstanceId ||
                                                !!installing
                                            }
                                            onClick={() =>
                                                setDeleting(
                                                    instance
                                                )
                                            }
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            );

                        }
                    )}

                </div>

            )}


            {/* CREATE / EDIT MODAL */}

            {showCreate && (

                <div className="modal-background">

                    <div className="modal">

                        <h2>
                            {
                                editing
                                    ? "Edit Instance"
                                    : "Create Instance"
                            }
                        </h2>


                        <div className="form-group">

                            <label>
                                Instance Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={event =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="My Minecraft Instance"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Minecraft Version
                            </label>

                            <select
                                value={
                                    minecraftVersion
                                }
                                disabled={
                                    loadingVersions
                                }
                                onChange={event =>
                                    setMinecraftVersion(
                                        event.target.value
                                    )
                                }
                            >

                                {versions.map(
                                    version => (

                                        <option
                                            key={
                                                version.id
                                            }
                                            value={
                                                version.id
                                            }
                                        >
                                            {
                                                version.id
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        <div className="form-group">

                            <label>
                                Mod Loader
                            </label>

                            <select
                                value={
                                    loader
                                }
                                onChange={event =>
                                    setLoader(
                                        event.target.value as ModLoader
                                    )
                                }
                            >

                                <option value="vanilla">
                                    Vanilla
                                </option>

                                <option value="fabric">
                                    Fabric
                                </option>

                                <option value="quilt">
                                    Quilt
                                </option>

                                <option
                                    value="forge"
                                    disabled
                                >
                                    Forge (Coming Soon)
                                </option>

                                <option
                                    value="neoforge"
                                    disabled
                                >
                                    NeoForge (Coming Soon)
                                </option>

                            </select>

                        </div>


                        <div className="form-group">

                            <label>
                                Instance Icon
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleIconUpload
                                }
                            />

                        </div>


                        {icon && (

                            <img
                                className="instance-icon-image"
                                src={icon}
                                alt=""
                            />

                        )}


                        <div className="modal-actions">

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setShowCreate(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="primary-button"
                                disabled={
                                    loadingVersions
                                }
                                onClick={
                                    handleSave
                                }
                            >
                                {
                                    editing
                                        ? "Save Changes"
                                        : "Create Instance"
                                }
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* DELETE CONFIRMATION */}

            {deleting && (

                <div className="modal-background">

                    <div className="modal">

                        <h2>
                            Delete Instance
                        </h2>

                        <p>
                            Are you sure you want to{" "}
                            <strong>
                                {deleting.name}
                            </strong>
                            ?
                        </p>

                        <p>
                            This will delete the instance
                            files from Novex.
                        </p>


                        <div className="modal-actions">

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setDeleting(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="danger-button"
                                onClick={
                                    confirmDelete
                                }
                            >
                                Delete Instance
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* INSTALLATION */}

            {installing && (

                <div className="modal-background">

                    <div className="modal">

                        <div className="install-spinner">
                            ↓
                        </div>

                        <h2>
                            Installing Minecraft
                        </h2>

                        <p>
                            Minecraft{" "}
                            {
                                installing.minecraftVersion
                            }
                        </p>

                        <p>
                            Loader:{" "}
                            {
                                formatLoader(
                                    installing.loader
                                )
                            }
                        </p>


                        {installProgress && (

                            <>

                                <div className="progress-track">

                                    <div
                                        className="progress-bar"
                                        style={{
                                            width:
                                                calculateProgress(
                                                    installProgress
                                                ) +
                                                "%"
                                        }}
                                    />

                                </div>


                                <div className="progress-text">

                                    {
                                        installProgress.message
                                    }

                                </div>


                                {installProgress.total > 0 && (

                                    <div className="progress-details">

                                        {
                                            formatBytes(
                                                installProgress.current
                                            )
                                        }

                                        {" / "}

                                        {
                                            formatBytes(
                                                installProgress.total
                                            )
                                        }

                                    </div>

                                )}

                            </>

                        )}


                        {!installError && (

                            <div className="modal-actions">

                                <button
                                    className="secondary-button"
                                    onClick={async () => {

                                        await window.novex.minecraft.cancelInstall();

                                        setInstalling(null);

                                        setInstallProgress(null);

                                    }}
                                >
                                    Cancel Installation
                                </button>

                            </div>

                        )}


                        {installError && (

                            <div className="install-error">

                                <strong>
                                    Installation failed
                                </strong>

                                <p>
                                    {
                                        installError
                                    }
                                </p>

                                <button
                                    className="secondary-button"
                                    onClick={() => {

                                        setInstalling(
                                            null
                                        );

                                        setInstallError(
                                            ""
                                        );

                                        setInstallProgress(
                                            null
                                        );

                                    }}
                                >
                                    Close
                                </button>

                            </div>

                        )}

                    </div>

                </div>

            )}


            {/* MINECRAFT CONSOLE */}

            <MinecraftConsole
                open={
                    consoleInstance !== null
                }
                instanceName={
                    consoleInstance?.name || ""
                }
                onClose={() =>
                    setConsoleInstance(
                        null
                    )
                }
            />

        </div>

    );

}


/*
 * ============================================================
 * FORMAT STATE
 * ============================================================
 */

function formatState(
    state: string
): string {

    switch (state) {

        case "starting":
            return "Starting...";

        case "running":
            return "Running";

        case "stopping":
            return "Stopping...";

        case "stopped":
            return "Stopped";

        case "crashed":
            return "Crashed";

        default:
            return state;

    }

}


/*
 * ============================================================
 * CALCULATE PROGRESS
 * ============================================================
 */

function calculateProgress(
    progress: InstallProgress
): number {

    if (
        progress.total <= 0
    ) {

        return 0;

    }

    return Math.min(
        100,
        Math.max(
            0,
            (
                progress.current /
                progress.total
            ) * 100
        )
    );

}


/*
 * ============================================================
 * FORMAT BYTES
 * ============================================================
 */

function formatBytes(
    bytes: number
): string {

    if (
        !Number.isFinite(bytes) ||
        bytes <= 0
    ) {

        return "0 B";

    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    const safeIndex =
        Math.min(
            index,
            units.length - 1
        );

    return (
        bytes /
        Math.pow(
            1024,
            safeIndex
        )
    ).toFixed(1) +
        " " +
        units[safeIndex];

}


/*
 * ============================================================
 * FORMAT LOADER
 * ============================================================
 */

function formatLoader(
    loader: ModLoader
): string {

    switch (loader) {

        case "vanilla":
            return "Vanilla";

        case "fabric":
            return "Fabric";

        case "forge":
            return "Forge";

        case "neoforge":
            return "NeoForge";

        case "quilt":
            return "Quilt";

        default:
            return "Unknown";

    }

}


export default Instances;