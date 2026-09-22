import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const script = fileURLToPath(new URL('../electron/gameSupervisor.cjs', import.meta.url));
function monitor(code, secret = '') {
    const child = spawn(process.execPath, [script], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    const messages = [];
    child.on('message', message => messages.push(message));
    child.send({ type: 'launch', executable: process.execPath, args: ['-e', code], cwd: os.tmpdir(), secret });
    return { child, messages };
}
async function waitMessage(child, type) {
    for (;;) { const [message] = await once(child, 'message', { signal: AbortSignal.timeout(10000) }); if (message.type === type) return message; }
}
test('monitor filters tokens split across writes and reports process exit', { timeout: 15000 }, async () => {
    const { child, messages } = monitor("process.stdout.write('sec'); setTimeout(() => process.stdout.write('ret\\n'), 50)", 'secret');
    await once(child, 'exit');
    assert.ok(messages.some(m => m.type === 'started'));
    assert.ok(messages.some(m => m.type === 'closed' && m.code === 0));
    assert.equal(messages.filter(m => m.type === 'log').map(m => m.text).join(''), '[REDACTED]\n');
});
test('stop terminates the monitored game and reports intentional stop', { timeout: 15000 }, async () => {
    const { child } = monitor('setInterval(() => {}, 1000)');
    await waitMessage(child, 'started');
    const closed = waitMessage(child, 'closed');
    child.send({ type: 'stop' });
    assert.equal((await closed).stopping, true);
    await once(child, 'exit');
});
test('game survives Novex disconnect and monitor exits when game finishes', { timeout: 15000 }, async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'novex-survival-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
    const result = path.join(root, 'survived.txt');
    const { child } = monitor(`setTimeout(() => { require('node:fs').writeFileSync(${JSON.stringify(result)}, 'alive'); process.stdout.write('still draining\\n'); }, 250)`);
    await waitMessage(child, 'started');
    child.disconnect();
    await once(child, 'exit');
    assert.equal(await fs.readFile(result, 'utf8'), 'alive');
});

test('immediate failure retains stderr, stdout and nonzero exit code', {timeout:15000},async()=>{
    const {child,messages}=monitor("process.stdout.write('startup\\n');process.stderr.write('native error\\n');process.exitCode=7;");
    await once(child,'exit');
    const logs=messages.filter(m=>m.type==='log').map(m=>m.text).join('');
    assert.match(logs,/startup/);assert.match(logs,/native error/);
    assert.ok(messages.some(m=>m.type==='closed'&&m.code===7));
});
test('monitor preserves cwd spaces and argument-array quoting without a shell', {timeout:15000},async t=>{
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'novex path spaces '));t.after(()=>fs.rm(root,{recursive:true,force:true}));
    const child=spawn(process.execPath,[script],{stdio:['ignore','ignore','ignore','ipc']});
    const messages=[];child.on('message',message=>messages.push(message));
    const argument='C:\\Users\\A Player\\library.jar;other.jar & literal "quote"';
    child.send({type:'launch',executable:process.execPath,args:['-e',"console.log(JSON.stringify({cwd:process.cwd(),arg:process.argv[1]}))",argument],cwd:root,secret:''});
    await once(child,'exit');
    const payload=JSON.parse(messages.filter(m=>m.type==='log').map(m=>m.text).join(''));
    assert.equal(payload.cwd,root);assert.equal(payload.arg,argument);
});

test('spawn failure reports the actual OS error without credentials', {timeout:15000},async()=>{
 const child=spawn(process.execPath,[script],{stdio:['ignore','ignore','ignore','ipc']});const messages=[];
 child.on('message',message=>messages.push(message));
 child.send({type:'launch',executable:path.join(os.tmpdir(),'novex-nonexistent-java-executable'),args:['--accessToken','secret-token'],cwd:os.tmpdir(),secret:'secret-token'});
 await once(child,'exit');
 const error=messages.find(message=>message.type==='error');assert.equal(error.error.code,'ENOENT');assert.match(error.error.message,/ENOENT/);assert.ok(error.error.stack);assert.equal(JSON.stringify(messages).includes('secret-token'),false);
});
