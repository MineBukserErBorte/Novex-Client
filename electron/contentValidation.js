export function validateModrinthVersion(version, projectId, gameVersion, loader) {
    if (!version || version.project_id !== projectId) throw new Error('The selected Modrinth file belongs to a different project.');
    if (!Array.isArray(version.game_versions) || !version.game_versions.includes(gameVersion)) throw new Error(`This file does not support Minecraft ${gameVersion}. Select a compatible version.`);
    if (loader && (!Array.isArray(version.loaders) || !version.loaders.includes(loader))) throw new Error(`This file does not support the instance’s ${loader} loader.`);
}
