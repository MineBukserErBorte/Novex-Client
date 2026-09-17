import { useState, type ReactNode } from 'react';
import NovexSelect from './NovexSelect';
export type ContentProviderId = 'modrinth' | 'curseforge';
export type ContentKind = 'mod' | 'modpack' | 'resourcepack' | 'shader';
// Only the preference is stored. Existing favorites and instance data are untouched.
export default function ContentSource({ kind, children }: { kind: ContentKind; children: ReactNode }) {
    const key = `novex-content-source-${kind}`;
    const [source, setSource] = useState<ContentProviderId>(() => localStorage.getItem(key) === 'curseforge' ? 'curseforge' : 'modrinth');
    return <section className="content-source-page">
        <div className="content-source-control"><span>Source</span><NovexSelect label="Content source" value={source} options={[{ value:'modrinth', label:'Modrinth' },{ value:'curseforge', label:'CurseForge — setup required' }]} onChange={value => { const next = value === 'curseforge' ? 'curseforge' : 'modrinth'; localStorage.setItem(key, next); setSource(next); }} /><span className="provider-badge">{source === 'modrinth' ? 'Modrinth' : 'CurseForge'}</span></div>
        {source === 'modrinth' ? children : <div className="card provider-setup"><h2>CurseForge needs operator setup</h2><p>CurseForge browsing and installation are not enabled in this build. Novex needs approved API access and a secure server integration before it can offer this source.</p><p>No API key is included or requested here. Download restrictions will not be bypassed. Your existing Modrinth content and Minecraft folders are unchanged.</p><button className="secondary-button" onClick={() => { localStorage.setItem(key, 'modrinth'); setSource('modrinth'); }}>Use Modrinth</button></div>}
    </section>;
}
