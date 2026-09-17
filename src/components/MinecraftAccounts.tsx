import NovexSelect from "./NovexSelect";
import { useEffect, useState } from 'react';
import type { MinecraftAccountsState } from '../services/minecraftAccounts';
export default function MinecraftAccounts({ compact = false }: { compact?: boolean }) {
    const [state, setState] = useState<MinecraftAccountsState | null>(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');
    const [localName, setLocalName] = useState('NovexPlayer');
    useEffect(() => {
        const reload = () => { void window.novex.minecraftAccounts.list().then(setState).catch(err => setError(err.message)); };
        reload();
        window.addEventListener('novex-minecraft-accounts', reload);
        const cleanup = window.novex.minecraftAccounts.onProgress(setProgress);
        return () => { cleanup(); window.removeEventListener('novex-minecraft-accounts', reload); };
    }, []);
    async function perform(action: () => Promise<MinecraftAccountsState>) {
        setBusy(true); setError(''); setProgress('');
        try { setState(await action()); window.dispatchEvent(new Event('novex-minecraft-accounts')); }
        catch (err) { setError(err instanceof Error ? err.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : 'Account operation failed.'); }
        finally { setBusy(false); void window.novex.minecraftAccounts.list().then(setState).catch(() => {}); }
    }
    return <section className="card minecraft-accounts">
        <h2>Minecraft account</h2>
        {!compact && <p>Microsoft accounts authenticate Minecraft. Your Novex account for friends and chat is separate.</p>}
        <div className="settings-field"><span>Selected account</span><NovexSelect label="Selected Minecraft account" value={state?.selectedId || ''} disabled={busy} placeholder="Select a Minecraft account" options={(state?.accounts || []).map(account => ({ value: account.id, label: `${account.username} — ${account.type === 'local' ? 'Offline / Local Account' : 'Microsoft'}` }))} onChange={value => void perform(() => window.novex.minecraftAccounts.select(value))} /></div>
        {!compact && <>
            {state?.secureStorage === false && <p role="status">Secure desktop storage is unavailable. Authentication stays in memory for this session. Unlock or enable your desktop keyring to remember sign-in securely.</p>}
            <div className="account-actions"><button disabled={busy} onClick={() => void perform(() => window.novex.minecraftAccounts.login())}>Sign in with Microsoft</button>
                {busy && <button onClick={() => void window.novex.minecraftAccounts.cancel().catch(err => setError(err.message))}>Cancel sign-in</button>}</div>
            <div aria-live="polite">{busy ? progress : ''}</div>
            {state?.accounts.map(account => <article className="minecraft-account-row" key={account.id}>
                {account.skinUrl && <div aria-label={`${account.username} Minecraft head`} role="img" className="minecraft-head" style={{ backgroundImage: `url("${account.skinUrl}")` }} />}
                <div><strong>{account.username}{state.selectedId === account.id ? ' · Selected' : ''}</strong><p>{account.type === 'local' ? 'Offline / Local Account' : 'Microsoft Minecraft account'}</p><code>{account.uuid}</code><p>{account.authenticationStatus}</p></div>
                <div className="account-actions">{account.type === 'microsoft' && <button disabled={busy} onClick={() => void perform(() => window.novex.minecraftAccounts.refresh(account.id))}>Refresh</button>}
                    <button disabled={busy} onClick={() => void perform(() => window.novex.minecraftAccounts.remove(account.id))}>Remove</button></div>
            </article>)}
            <details><summary>Offline / Local Account</summary><p>Local play only. This does not verify ownership or authenticate to online-mode servers.</p><label>Local username <input maxLength={16} value={localName} onChange={event => setLocalName(event.target.value)} /></label><button disabled={busy} onClick={() => void perform(() => window.novex.minecraftAccounts.addLocal(localName))}>Add local account</button></details>
        </>}
        {compact && !state?.accounts.length && <p>Add a Microsoft or Offline / Local Account in Settings before playing.</p>}
        {error && <p className="error" role="alert">{error}</p>}
    </section>;
}
