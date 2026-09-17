import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
for (const file of await fs.readdir('electron')) if (/\.(js|cjs)$/.test(file)) execFileSync(process.execPath, ['--check', `electron/${file}`], { stdio: 'inherit' });
console.log('Electron source syntax checks passed.');
