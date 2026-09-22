import {useEffect, useState} from 'react';
import type {MinecraftInstance} from '../services/instances';
import {uiError} from '../services/uiError';
export default function InstalledMods({instance, revision}: {instance:MinecraftInstance; revision:number}) {
    const [mods,setMods]=useState<{name:string;enabled:boolean}[]>([]);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    async function refresh() {
        setBusy(true);setError('');
        try {setMods(await window.novex.mods.list(instance));}
        catch(error) {setError(uiError(error,'Unable to read installed mods.'));}
        finally {setBusy(false);}
    }
    useEffect(()=>{void refresh();},[instance.id,revision]);
    async function toggle(name:string, enabled:boolean) {
        setBusy(true);setError('');
        try {await window.novex.mods.setEnabled(instance,name,enabled);setMods(await window.novex.mods.list(instance));}
        catch(error) {setError(uiError(error,'Unable to change this mod.'));}
        finally {setBusy(false);}
    }
    return <section className="card" style={{padding:16,marginBottom:20}}>
        <div className="utility-actions"><h2 style={{margin:0}}>Installed mods</h2><button className="secondary-button" disabled={busy} onClick={()=>void refresh()}>{busy?'Working…':'Refresh'}</button></div>
        <p>Stop Minecraft before enabling or disabling mods. Files are kept in the instance.</p>
        {error && <p role="alert">{error}</p>}
        <div style={{maxHeight:300,overflowY:'auto'}}>
            {mods.map(mod=><div key={mod.name} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #30343a'}}>
                <span style={{flex:1,minWidth:0,overflowWrap:'anywhere'}}>{mod.name}</span><span>{mod.enabled?'Enabled':'Disabled'}</span>
                <button className="secondary-button" disabled={busy} onClick={()=>void toggle(mod.name,!mod.enabled)}>{mod.enabled?'Disable':'Enable'}</button>
            </div>)}
        </div>
        {!mods.length && !busy && !error && <p>No installed mods.</p>}
    </section>;
}
