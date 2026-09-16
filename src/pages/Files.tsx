import {
    useEffect,
    useState
} from "react";

import NovexSelect from "../components/NovexSelect";

import type {
    MinecraftInstance
} from "../services/instances";


type Props = {
    instances: MinecraftInstance[];
};


type FileItem = {
    name: string;
    path: string;
    type:
        | "file"
        | "directory";
    size?: number;
    modified?: number;
};


export default function Files({
    instances
}: Props) {

    const [
        selectedInstanceId,
        setSelectedInstanceId
    ] = useState(
        instances[0]?.id ?? ""
    );

    const [files, setFiles] =
        useState<FileItem[]>([]);

    const [currentPath, setCurrentPath] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    const selectedInstance =
        instances.find(
            instance =>
                instance.id ===
                selectedInstanceId
        );


    useEffect(() => {

        if (
            !instances.some(
                instance =>
                    instance.id ===
                    selectedInstanceId
            )
        ) {

            setSelectedInstanceId(
                instances[0]?.id ?? ""
            );

            setCurrentPath("");

        }

    }, [
        instances,
        selectedInstanceId
    ]);


    async function loadFiles() {

        if (!selectedInstance) {

            setFiles([]);

            return;

        }

        setLoading(true);
        setError("");

        try {

            const result =
                await window.novex.files.list(
                    selectedInstance,
                    currentPath
                );

            setFiles(
                Array.isArray(result)
                    ? result
                    : []
            );

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load files."
            );

        } finally {

            setLoading(false);

        }

    }


    useEffect(() => {

        void loadFiles();

    }, [
        selectedInstanceId,
        currentPath
    ]);


    function changeInstance(
        id: string
    ) {

        setSelectedInstanceId(id);
        setCurrentPath("");

    }


    function openFolder(
        file: FileItem
    ) {

        if (
            file.type !==
            "directory"
        ) {
            return;
        }

        setCurrentPath(
            file.path
        );

    }


    function goBack() {

        if (!currentPath) {
            return;
        }

        const parts =
            currentPath
                .replace(/\\/g, "/")
                .split("/")
                .filter(Boolean);

        parts.pop();

        setCurrentPath(
            parts.join("/")
        );

    }


    async function openInstanceFolder() {

        if (!selectedInstance) {
            return;
        }

        try {

            await window.novex.instances.openFolder(
                selectedInstance
            );

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to open instance folder."
            );

        }

    }


    async function deleteFile(
        file: FileItem
    ) {

        if (
            !selectedInstance
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${file.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            await window.novex.files.delete(
                selectedInstance,
                file.path
            );

            await loadFiles();

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete."
            );

        }

    }


    async function renameFile(
        file: FileItem
    ) {

        if (!selectedInstance) {
            return;
        }

        const newName =
            window.prompt(
                "Enter the new name:",
                file.name
            )?.trim();

        if (
            !newName ||
            newName === file.name
        ) {
            return;
        }

        try {

            await window.novex.files.rename(
                selectedInstance,
                file.path,
                newName
            );

            await loadFiles();

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to rename."
            );

        }

    }


    if (!instances.length) {

        return (

            <div className="page">

                <div className="page-header">

                    <div>

                        <div className="eyebrow">
                            INSTANCE FILES
                        </div>

                        <h1>
                            Files
                        </h1>

                        <p>
                            Browse and manage
                            your Minecraft files.
                        </p>

                    </div>

                </div>

                <div className="empty-card">

                    <div className="empty-icon">
                        +
                    </div>

                    <h3>
                        Create an instance first
                    </h3>

                    <p>
                        Your instance files
                        will appear here.
                    </p>

                </div>

            </div>

        );

    }


    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <div className="eyebrow">
                        INSTANCE FILES
                    </div>

                    <h1>
                        Files
                    </h1>

                    <p>
                        Browse and manage files
                        inside your selected instance.
                    </p>

                </div>

                <button
                    className="secondary-button"
                    onClick={() =>
                        void openInstanceFolder()
                    }
                >
                    Open Instance Folder
                </button>

            </div>


            <div className="content-toolbar files-instance-select">

                <div className="toolbar-field">

                    <span className="toolbar-label">
                        Instance
                    </span>

                    <NovexSelect
                        value={
                            selectedInstanceId
                        }
                        onChange={
                            changeInstance
                        }
                        options={
                            instances.map(
                                instance => ({
                                    value:
                                        instance.id,

                                    label:
                                        `${instance.name}  ·  ${instance.minecraftVersion}`
                                })
                            )
                        }
                    />

                </div>

            </div>


            <div className="files-path-bar">

                <button
                    className="icon-button"
                    onClick={goBack}
                    disabled={!currentPath}
                    aria-label="Go back"
                >
                    ←
                </button>

                <div className="files-path-icon">
                    /
                </div>

                <code>
                    {currentPath || "/"}
                </code>

            </div>


            {error && (
                <div className="error">
                    {error}
                </div>
            )}


            {loading ? (

                <div className="empty-card compact-empty">

                    <div className="loading-spinner" />

                    <h3>
                        Loading files
                    </h3>

                </div>

            ) : !files.length ? (

                <div className="empty-card compact-empty">

                    <h3>
                        This folder is empty
                    </h3>

                    <p>
                        There are no files
                        or folders here.
                    </p>

                </div>

            ) : (

                <div className="files-list">

                    {files.map(file => (

                        <article
                            className="file-card"
                            key={file.path}
                            onDoubleClick={() =>
                                openFolder(file)
                            }
                        >

                            <div className="file-icon">
                                {
                                    file.type ===
                                    "directory"
                                        ? "DIR"
                                        : "FILE"
                                }
                            </div>

                            <div className="file-info">

                                <h3
                                    title={file.name}
                                >
                                    {file.name}
                                </h3>

                                <span>
                                    {
                                        file.type ===
                                        "directory"
                                            ? "Folder"
                                            : formatSize(
                                                file.size ??
                                                0
                                            )
                                    }
                                </span>

                            </div>

                            <div className="file-actions">

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        void renameFile(
                                            file
                                        )
                                    }
                                >
                                    Rename
                                </button>

                                <button
                                    className="danger-button"
                                    onClick={() =>
                                        void deleteFile(
                                            file
                                        )
                                    }
                                >
                                    Delete
                                </button>

                            </div>

                        </article>

                    ))}

                </div>

            )}

        </div>

    );
}


function formatSize(
    size: number
) {

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 ** 2) {
        return `${(
            size / 1024
        ).toFixed(1)} KB`;
    }

    if (size < 1024 ** 3) {
        return `${(
            size / 1024 ** 2
        ).toFixed(1)} MB`;
    }

    return `${(
        size / 1024 ** 3
    ).toFixed(1)} GB`;
}