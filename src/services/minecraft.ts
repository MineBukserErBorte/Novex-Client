const VERSION_MANIFEST =
    "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

export interface MinecraftVersion {
    id: string;
    type: "release" | "snapshot" | "old_beta" | "old_alpha";
    url: string;
    releaseTime: string;
}

interface MojangManifest {
    latest: {
        release: string;
        snapshot: string;
    };

    versions: MinecraftVersion[];
}

export async function getMinecraftVersions() {
    const response = await fetch(VERSION_MANIFEST);

    if (!response.ok) {
        throw new Error(
            "Failed to download Minecraft version manifest."
        );
    }

    const manifest =
        (await response.json()) as MojangManifest;

    return manifest.versions;
}

export function getRecommendedVersions(
    versions: MinecraftVersion[]
) {
    return versions.filter(version => {
        if (version.type !== "release") {
            return false;
        }

        return (
            version.id.startsWith("1.21.") ||
            version.id.startsWith("1.20.") ||
            version.id.startsWith("26.")
        );
    });
}