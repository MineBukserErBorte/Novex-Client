import fs from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const seen = new Set();
const notices = [];
async function locate(name, from) {
    let cursor = from;
    while (true) {
        const candidate = path.join(cursor, 'node_modules', name);
        try { await fs.access(path.join(candidate, 'package.json')); return candidate; } catch {}
        const parent = path.dirname(cursor); if (parent === cursor) return null; cursor = parent;
    }
}
async function visit(name, from, optional = false) {
    const directory = await locate(name, from);
    if (!directory) { if (optional) return; throw new Error(`Missing dependency for license notices: ${name}`); }
    const pkg = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8'));
    const key = `${pkg.name}@${pkg.version}`;
    if (seen.has(key)) return; seen.add(key);
    const texts = [];
    for (const file of await fs.readdir(directory)) if (/^(licen[cs]e|copying|notice)(\.|$)/i.test(file) && (await fs.stat(path.join(directory, file))).isFile()) texts.push({ file, text: await fs.readFile(path.join(directory, file), 'utf8') });
    notices.push({ name: pkg.name, version: pkg.version, license: typeof pkg.license === 'string' ? pkg.license : pkg.license?.type || 'Not specified — review required', texts });
    for (const dep of Object.keys(pkg.dependencies || {})) await visit(dep, directory, Boolean(pkg.optionalDependencies?.[dep]));
    for (const dep of Object.keys(pkg.optionalDependencies || {})) await visit(dep, directory, true);
}
for (const dep of [...Object.keys(manifest.dependencies), 'electron']) await visit(dep, root);
await fs.mkdir(path.join(root, 'public'), { recursive: true });
await fs.writeFile(path.join(root, 'public', 'third-party-notices.json'), JSON.stringify(notices.sort((a,b) => a.name.localeCompare(b.name)), null, 2));
console.log(`Generated notices for ${notices.length} dependencies.`);
