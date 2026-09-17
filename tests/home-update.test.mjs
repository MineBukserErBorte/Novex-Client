import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs/promises';
import { releaseVersion, RELEASES_URL } from '../electron/updateSource.js';
// Compile the actual pure renderer validator without requiring a browser or backend.
const source = await fs.readFile(new URL('../src/services/homeSlideValidation.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { parseSlide, visibleSlides, safeHttps } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const row = { id: '11111111-2222-3333-4444-555555555555', type: 'announcement', title: 'News', enabled: true, sort_order: 0 };
test('remote slides reject executable URLs, malformed records, overlong fields and invalid dates', () => {
    assert.ok(parseSlide(row));
    for (const patch of [{type:'execute'}, {title:'x'.repeat(121)}, {enabled:'true'}, {sort_order:Infinity}, {button_url:'javascript:alert(1)'}, {image_url:'file:///tmp/a'}, {button_url:'https://user:pass@example.org'}, {server_address:'host;rm -rf'}, {starts_at:'not a date'}, {starts_at:'2026-10-01',ends_at:'2026-09-01'}]) assert.equal(parseSlide({...row,...patch}), null);
    assert.equal(safeHttps('https://example.org/path'), 'https://example.org/path');
    assert.equal(safeHttps('data:text/html,bad'), '');
});
test('scheduled slides filter by time and enabled flag, then sort deterministically', () => {
    const active = parseSlide({...row,starts_at:'2026-01-01',ends_at:'2027-01-01'});
    const disabled = parseSlide({...row,id:'22222222-2222-3333-4444-555555555555',enabled:false});
    assert.deepEqual(visibleSlides([disabled,active],Date.parse('2026-09-01')), [active]);
    assert.equal(visibleSlides([active],Date.parse('2027-01-01')).length,0);
});
function release(tag) { return {tag_name:tag,html_url:`${RELEASES_URL}/tag/${tag}`,draft:false,prerelease:false,assets:[]}; }
test('release checks use semantic precedence and reject untrusted or draft metadata', () => {
    assert.equal(releaseVersion('0.9.0',release('v0.10.0')).latest,'0.10.0');
    assert.equal(releaseVersion('0.10.0',release('v0.9.0')),null);
    assert.equal(releaseVersion('0.10.0',release('v0.10.0')),null);
    for (const change of [{draft:true},{prerelease:true},{html_url:'https://evil.example/download'},{tag_name:'v1.0.0;bad'}]) assert.equal(releaseVersion('0.1.0',{...release('v1.0.0'),...change}),null);
    assert.equal(releaseVersion('0.1.0',{...release('v1.0.0'),assets:[{name:'bad.exe',browser_download_url:'https://evil.example/bad.exe'}]}).formats.length,0);
});
