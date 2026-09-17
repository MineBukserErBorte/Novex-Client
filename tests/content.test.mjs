import test from 'node:test';
import assert from 'node:assert/strict';
import { validateModrinthVersion } from '../electron/contentValidation.js';
test('exact Modrinth files must match project, game version and loader', () => {
    const version = { project_id:'real-project', game_versions:['1.21.1'], loaders:['fabric'] };
    assert.doesNotThrow(()=>validateModrinthVersion(version,'real-project','1.21.1','fabric'));
    assert.throws(()=>validateModrinthVersion(version,'other-project','1.21.1','fabric'),/different project/);
    assert.throws(()=>validateModrinthVersion(version,'real-project','1.20.1','fabric'),/does not support Minecraft/);
    assert.throws(()=>validateModrinthVersion(version,'real-project','1.21.1','forge'),/loader/);
    assert.doesNotThrow(()=>validateModrinthVersion(version,'real-project','1.21.1'));
});
