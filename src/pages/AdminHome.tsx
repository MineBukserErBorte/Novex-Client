import { useDialogs } from "../components/Dialogs";
import NovexSelect from "../components/NovexSelect";
import { useEffect, useState } from 'react';
import { deleteSlide, fetchSlides, isHomeAdmin, saveSlide } from '../services/homeContent';
import { parseSlide, slideTypes, type HomeSlide } from '../services/homeSlideValidation';
import { SlideContent } from '../components/HomeCarousel';
const fresh = (): HomeSlide => ({ id: crypto.randomUUID(), type: 'announcement', title: '', subtitle: '', description: '', image_url: '', button_text: '', button_url: '', server_address: '', enabled: false, sort_order: 0, starts_at: null, ends_at: null });
const localTime = (value: string | null) => value ? new Date(Date.parse(value) - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
export default function AdminHome() {
    const { confirm } = useDialogs();
    const [slides, setSlides] = useState<HomeSlide[]>([]);
    const [draft, setDraft] = useState<HomeSlide>(fresh);
    const [existing, setExisting] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    async function reload() { if (!await isHomeAdmin()) throw new Error('Admin access is required.'); setSlides(await fetchSlides(true)); }
    useEffect(() => { void reload().catch(err => setMessage(err.message)); }, []);
    async function perform(action: () => Promise<void>) {
        setBusy(true); setMessage('');
        try { await action(); await reload(); setMessage('Home content saved. Connected clients will refresh automatically.'); }
        catch (err) { setMessage(err instanceof Error ? err.message : 'Home content could not be saved.'); }
        finally { setBusy(false); }
    }
    const preview = parseSlide(draft);
    return <div className="admin-home"><h1>Admin → Home Content</h1><p>Changes are protected by database permissions. New slides start disabled. Dates use your local time.</p>
        <div className="admin-layout"><section className="card admin-list"><h2>Slides</h2><button className="primary-button" disabled={busy} onClick={() => { setDraft(fresh()); setExisting(false); setMessage(''); }}>Create slide</button>
            {slides.length === 0 && <p className="admin-empty">No remote slides yet. Create a slide, enable it and save to publish it on Home.</p>}
            {slides.map(slide => <button className={`admin-slide-row ${slide.id === draft.id ? 'selected' : ''}`} key={slide.id} disabled={busy} onClick={() => { setDraft(slide); setExisting(true); setMessage(''); }}><strong>{slide.title}</strong><span>{slide.enabled ? 'Enabled' : 'Disabled'} · Order {slide.sort_order} · {slide.type}</span></button>)}
        </section>
        <form className="card admin-form" onSubmit={event => { event.preventDefault(); void perform(async () => { await saveSlide(draft, existing); setExisting(true); }); }}>
            <h2>{existing ? 'Edit slide' : 'New slide'}</h2>
            <div className="settings-field"><span>Type</span><NovexSelect label="Slide type" value={draft.type} disabled={busy} options={slideTypes.map(type => ({ value:type,label:type.replaceAll("_"," ") }))} onChange={value => setDraft({ ...draft, type: value as HomeSlide['type'] })} /></div>
            {(['title', 'subtitle', 'image_url', 'button_text', 'button_url', 'server_address'] as const).map(key => <label key={key}>{({title:'Title',subtitle:'Subtitle',image_url:'Image URL (HTTPS)',button_text:'Button text',button_url:'Button URL (HTTPS)',server_address:'Minecraft server address'})[key]}<input required={key === 'title'} disabled={busy} maxLength={key.endsWith('url') ? 2048 : key === 'title' ? 120 : key === 'button_text' ? 60 : key === 'server_address' ? 253 : 200} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
            <label>Description<textarea disabled={busy} maxLength={2000} rows={4} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
            <div className="admin-inline"><label>Sort order<input type="number" min={-1000000} max={1000000} step={1} disabled={busy} value={draft.sort_order} onChange={event => setDraft({ ...draft, sort_order: Number(event.target.value) })} /></label><label><input type="checkbox" disabled={busy} checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })} /> Enabled</label></div>
            <p>Lower order values appear first. The local welcome slide always stays first.</p>
            {(['starts_at', 'ends_at'] as const).map(key => <label key={key}>{key === 'starts_at' ? 'Start (optional)' : 'End (optional)'}<input type="datetime-local" disabled={busy} value={localTime(draft[key])} onChange={event => setDraft({ ...draft, [key]: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label>)}
            <div className="account-actions"><button type="submit" className="primary-button" disabled={busy || !preview}>{busy ? 'Saving…' : 'Save slide'}</button>{existing && <button type="button" className="danger-button" disabled={busy} onClick={async () => { if (await confirm(`Delete “${draft.title}”?`)) void perform(async () => { await deleteSlide(draft.id); setDraft(fresh()); setExisting(false); }); }}>Delete slide</button>}</div>
            {!preview && <p>Complete a title and valid fields to preview and save.</p>}
        </form></div>
        {message && <p role="status">{message}</p>}
        <h2>Preview · unpublished changes</h2>{preview && <SlideContent slide={preview} preview />}
    </div>;
}
