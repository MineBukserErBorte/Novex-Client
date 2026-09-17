import { useEffect, useState } from 'react';
import { legalDocuments, type LegalDocumentId } from '../legal/documents';
type Notice = { name: string; version: string; license: string; texts: { file: string; text: string }[] };
export default function Legal({ initial = 'terms' }: { initial?: LegalDocumentId }) {
    const [selected, setSelected] = useState<LegalDocumentId | 'licenses'>(initial);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [error, setError] = useState('');
    useEffect(() => {
        if (selected === 'licenses') void fetch('./third-party-notices.json').then(response => { if (!response.ok) throw new Error('License notices could not be loaded. Rebuild Novex to regenerate them.'); return response.json(); }).then(setNotices).catch(err => setError(err.message));
    }, [selected]);
    return <section className="card legal-section"><h2>Legal</h2><p>Initial drafts — operator and legal review required before public release.</p>
        <nav aria-label="Legal documents" className="account-actions">{Object.entries(legalDocuments).map(([id, doc]) => <button key={id} aria-pressed={id === selected} onClick={() => setSelected(id as LegalDocumentId)}>{doc.title}</button>)}<button aria-pressed={selected === 'licenses'} onClick={() => setSelected('licenses')}>Open Source Licenses</button></nav>
        {selected === 'licenses' ? <article><h3>Open Source Licenses</h3><p>Generated from installed dependency metadata and license/notice files. These licenses are separate from Novex’s own license. Electron’s packaged LICENSE and LICENSES.chromium.html also apply.</p>{error && <p role="alert">{error}</p>}{notices.map(notice => <details key={`${notice.name}@${notice.version}`}><summary>{notice.name} {notice.version} — {notice.license}</summary>{notice.texts.length ? notice.texts.map(text => <pre key={text.file}>{text.text}</pre>) : <p>License text was not present in the installed package. Publisher review required.</p>}</details>)}</article> : <article><h3>{legalDocuments[selected].title}</h3>{legalDocuments[selected].sections.map(([heading, body]) => <section key={heading}><h4>{heading}</h4><p>{body}</p></section>)}</article>}
    </section>;
}
