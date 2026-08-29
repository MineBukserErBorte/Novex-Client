import {
    useEffect,
    useState
} from "react";

import NovexSelect from "../components/NovexSelect";

type MinecraftVersion = {
    id: string;
    type:
        | "release"
        | "snapshot"
        | string;
    url: string;
    time: string;
    releaseTime: string;
};

type VersionManifest = {
    latest: {
        release: string;
        snapshot: string;
    };

    versions: MinecraftVersion[];
};

export default function Versions() {

    const [versions, setVersions] =
        useState<MinecraftVersion[]>([]);

    const [latest, setLatest] =
        useState<
            VersionManifest["latest"] |
            null
        >(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [filter, setFilter] =
        useState("release");


    async function loadVersions() {

        setLoading(true);
        setError("");

        try {

            const response =
                await fetch(
                    "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
                );

            if (!response.ok) {

                throw new Error(
                    `Minecraft versions failed: HTTP ${response.status}`
                );

            }

            const data =
                await response.json() as VersionManifest;

            setVersions(
                data.versions ?? []
            );

            setLatest(
                data.latest
            );

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load Minecraft versions."
            );

        } finally {

            setLoading(false);

        }

    }


    useEffect(() => {

        void loadVersions();

    }, []);


    const filtered =
        versions.filter(
            version =>
                filter === "all" ||
                version.type === filter
        );


    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <div className="eyebrow">
                        MINECRAFT
                    </div>

                    <h1>
                        Versions
                    </h1>

                    <p>
                        Browse the Minecraft versions
                        available to Novex.
                    </p>

                </div>

                <button
                    className="secondary-button"
                    onClick={() =>
                        void loadVersions()
                    }
                    disabled={loading}
                >
                    {
                        loading
                            ? "Refreshing..."
                            : "Refresh"
                    }
                </button>

            </div>


            {latest && (

                <div className="latest-version-grid">

                    <div className="latest-version-card">

                        <span>
                            LATEST RELEASE
                        </span>

                        <strong>
                            {latest.release}
                        </strong>

                        <small>
                            Recommended for normal
                            Minecraft play.
                        </small>

                    </div>

                    <div className="latest-version-card">

                        <span>
                            LATEST SNAPSHOT
                        </span>

                        <strong>
                            {latest.snapshot}
                        </strong>

                        <small>
                            Latest development build.
                        </small>

                    </div>

                </div>

            )}


            <div className="content-toolbar versions-toolbar">

                <div className="toolbar-field">

                    <span className="toolbar-label">
                        Show versions
                    </span>

                    <NovexSelect
                        value={filter}
                        onChange={setFilter}
                        options={[
                            {
                                value: "release",
                                label: "Releases"
                            },
                            {
                                value: "snapshot",
                                label: "Snapshots"
                            },
                            {
                                value: "all",
                                label: "All versions"
                            }
                        ]}
                    />

                </div>

                <span className="version-count">
                    {filtered.length.toLocaleString()}
                    {" versions"}
                </span>

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
                        Loading Minecraft versions
                    </h3>

                </div>

            ) : (

                <div className="version-grid">

                    {filtered.map(version => (

                        <article
                            className="version-card"
                            key={version.id}
                        >

                            <div className="version-card-main">

                                <div className="version-icon">
                                    MC
                                </div>

                                <div className="version-info">

                                    <h3>
                                        {version.id}
                                    </h3>

                                    <span>
                                        {version.type}
                                    </span>

                                </div>

                            </div>

                            <div className="version-date">

                                <span>
                                    Released
                                </span>

                                <strong>
                                    {
                                        new Date(
                                            version.releaseTime
                                        ).toLocaleDateString()
                                    }
                                </strong>

                            </div>

                        </article>

                    ))}

                </div>

            )}

        </div>

    );
}