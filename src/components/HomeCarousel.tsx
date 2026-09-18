import { useEffect, useState, type ReactNode } from 'react';
import { useHomeSlides } from '../hooks/useHomeSlides';
import type { HomeSlide } from '../services/homeSlideValidation';
export function SlideContent({ slide, preview = false }: { slide: HomeSlide; preview?: boolean }) {
    const [message, setMessage] = useState('');
    const [failedImage, setFailedImage] = useState(false);
    useEffect(() => { setFailedImage(false); setMessage(''); }, [slide.image_url, slide.id]);
    async function copy() {
        try { await navigator.clipboard.writeText(slide.server_address); setMessage('Server address copied.'); } catch { setMessage('Could not copy. Select and copy the address below.'); }
    }
    return <section className="home-hero remote-slide">
        <div className="home-hero-copy">
            <div className={`eyebrow ${slide.type === 'advertisement' ? 'sponsored-label' : ''}`}>{slide.type === 'advertisement' ? 'Sponsored' : slide.type === 'partner_server' ? 'Partner Server' : slide.type.replace('_', ' ')}</div>
            <h1>{slide.title}</h1>{slide.subtitle && <h3>{slide.subtitle}</h3>}<p>{slide.description}</p>
            {slide.type === 'partner_server' && slide.server_address && <p><code>{slide.server_address}</code></p>}
            <div className="home-hero-actions">
                {slide.type === 'partner_server' && slide.server_address && <button className="secondary-button" disabled={preview} onClick={() => void copy()}>Copy IP</button>}
                {slide.button_url && <button className="primary-button" disabled={preview} onClick={() => void window.novex.openExternal(slide.button_url).catch(() => setMessage('This link could not be opened.'))}>{slide.button_text || 'Learn More'} ↗</button>}
            </div><span role="status">{message}</span>
        </div>
        {slide.image_url && !failedImage ? <img className="slide-image" src={slide.image_url} alt="" referrerPolicy="no-referrer" onError={() => setFailedImage(true)} /> : <div className="slide-art" aria-hidden="true">N</div>}
    </section>;
}
// Local announcements keep Home useful before remote content is configured.
// Never invent advertisers or partner servers when the backend is empty/offline.
const localSlides: HomeSlide[] = [
    { id:'local-library', type:'announcement', title:'A home for every Minecraft setup.', subtitle:'Keep your worlds organized', description:'Separate your mods, saves and settings with instances. Your library stays on this computer.', image_url:'',button_text:'',button_url:'',server_address:'',enabled:true,sort_order:0,starts_at:null,ends_at:null },
    { id:'local-community', type:'news', title:'Make Novex your own.', subtitle:'Play, customize, connect', description:'Explore compatible content from Modrinth and connect with friends through your separate Novex account.', image_url:'',button_text:'',button_url:'',server_address:'',enabled:true,sort_order:1,starts_at:null,ends_at:null }
];
export default function HomeCarousel({ children }: { children: ReactNode }) {
    const { slides: remoteSlides, loading, offline } = useHomeSlides();
    const slides = remoteSlides.length ? remoteSlides : localSlides;
    const [interaction, setInteraction] = useState(0);
    const [selected, setSelected] = useState('welcome-local');
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(document.hidden);
    const keys = ['welcome-local', ...slides.map(slide => slide.id)];
    const index = Math.max(0, keys.indexOf(selected));
    const keySignature = keys.join(',');
    useEffect(() => { const listener = () => setHidden(document.hidden); document.addEventListener('visibilitychange', listener); return () => document.removeEventListener('visibilitychange', listener); }, []);
    useEffect(() => {
        if (hovered || focused || paused || hidden || keys.length < 2) return;
        const timer = setTimeout(() => setSelected(keys[(index + 1) % keys.length]), 7000);
        return () => clearTimeout(timer);
    }, [keySignature, index, hovered, focused, paused, hidden, interaction]);
    const select = (key: string) => { setSelected(key); setInteraction(value => value + 1); };
    const move = (step: number) => select(keys[(index + step + keys.length) % keys.length]);
    return <div className="home-carousel" role="region" aria-label="Novex news and announcements" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <div className="carousel-viewport"><div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
            <div className="carousel-panel" inert={index !== 0} aria-hidden={index !== 0}>{children}</div>
            {slides.map((slide, i) => <div className="carousel-panel" key={slide.id} inert={index !== i + 1} aria-hidden={index !== i + 1}><SlideContent slide={slide} /></div>)}
        </div></div>
        <div className="carousel-controls">
            <span className="carousel-status">{loading ? 'Loading announcements…' : offline ? `Local highlights · ${index + 1} / ${keys.length}` : `${index + 1} / ${keys.length}${remoteSlides.length ? '' : ' · Novex highlights'}`}</span>
            {keys.length > 1 && <><button aria-label="Previous slide" onClick={() => move(-1)}>←</button><div className="carousel-dots">{keys.map((key, i) => <button key={key} aria-label={`Show slide ${i + 1}`} aria-current={index === i ? 'true' : undefined} onClick={() => select(key)} />)}</div><button aria-label="Next slide" onClick={() => move(1)}>→</button><button onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}>{paused ? 'Play' : 'Pause'}</button></>}
        </div>
    </div>;
}
