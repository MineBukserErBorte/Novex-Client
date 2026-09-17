import { useState, type ReactNode } from 'react';
import Legal from '../pages/Legal';
import { LEGAL_VERSION, LEGAL_STORAGE_KEY, type LegalDocumentId } from '../legal/documents';
function accepted() { try { const value = JSON.parse(localStorage.getItem(LEGAL_STORAGE_KEY) || 'null'); return value?.version === LEGAL_VERSION && typeof value.acceptedAt === 'string'; } catch { return false; } }
export default function LegalGate({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(accepted);
    const [checked, setChecked] = useState(false);
    const [document, setDocument] = useState<LegalDocumentId | null>(null);
    const [error, setError] = useState('');
    if (ready) return children;
    return <main className="legal-welcome"><h1>Welcome to Novex</h1><p>Before continuing, please review the Terms of Service and Privacy Policy.</p>
        <div className="account-actions"><button onClick={() => setDocument('terms')}>Terms of Service</button><button onClick={() => setDocument('privacy')}>Privacy Policy</button></div>
        {document && <Legal key={document} initial={document} />}
        <label><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} /> I have read and agree to the Terms of Service and acknowledge the Privacy Policy.</label>
        <button disabled={!checked} onClick={() => { if (!checked) return; try { localStorage.setItem(LEGAL_STORAGE_KEY, JSON.stringify({ version: LEGAL_VERSION, acceptedAt: new Date().toISOString() })); setReady(true); } catch { setError('Novex could not save your acknowledgement. Check local storage permissions.'); } }}>Continue</button>
        {error && <p role="alert">{error}</p>}
        <p>Independent third-party application. Not approved by or associated with Mojang or Microsoft.</p>
    </main>;
}
