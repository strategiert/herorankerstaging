
import React, { useState, useEffect } from 'react';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { SKIN_DATABASE } from '../data/skins';
import { getBuildingAssetPath, getMapAssetPath } from '../utils/assets';
import { CheckCircle2, AlertTriangle, FileImage, RefreshCw, FolderOpen } from 'lucide-react';

const AssetRow: React.FC<{ label: string, path: string, found: boolean }> = ({ label, path, found }) => (
    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 mb-2">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${found ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {found ? <FileImage className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
                <div className="text-white font-bold text-xs truncate">{label}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={path}>
                    {path}
                </div>
            </div>
        </div>
        <div className="text-right shrink-0 pl-2">
            {found ? (
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                    GEFUNDEN
                </span>
            ) : (
                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                    SVG MODUS
                </span>
            )}
        </div>
    </div>
);

export const AssetMonitor = () => {
    const [status, setStatus] = useState<Record<string, boolean>>({});
    const [checking, setChecking] = useState(true);

    const checkImage = (path: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = path;
        });
    };

    const runCheck = async () => {
        setChecking(true);
        const newStatus: Record<string, boolean> = {};

        // 1. Check Map
        const mapPath = getMapAssetPath();
        newStatus[mapPath] = await checkImage(mapPath);

        // 2. Check Buildings (Default Skins)
        for (const building of Object.values(BUILDING_DEFINITIONS)) {
            const path = getBuildingAssetPath(building.id as any, 'default');
            newStatus[path] = await checkImage(path);
        }

        setStatus(newStatus);
        setChecking(false);
    };

    useEffect(() => {
        runCheck();
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-blue-500" /> Asset Diagnose
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Überprüft lokale Dateipfade in /public/assets</p>
                </div>
                <button 
                    onClick={runCheck} 
                    disabled={checking}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase px-1 mb-2">Hintergrund</h4>
                <AssetRow label="Space Station Map" path={getMapAssetPath()} found={!!status[getMapAssetPath()]} />
                
                <h4 className="text-xs font-bold text-slate-500 uppercase px-1 mt-4 mb-2">Gebäude Grafiken</h4>
                {Object.values(BUILDING_DEFINITIONS).map(b => (
                    <AssetRow 
                        key={b.id} 
                        label={b.name} 
                        path={getBuildingAssetPath(b.id as any, 'default')} 
                        found={!!status[getBuildingAssetPath(b.id as any, 'default')]} 
                    />
                ))}
            </div>

            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 text-xs text-blue-200 leading-relaxed">
                <strong className="block mb-1 text-blue-400">Info:</strong>
                Dateien, die nicht gefunden werden ("SVG MODUS"), werden automatisch durch generierten Code dargestellt. Um eigene Bilder zu nutzen, speichere PNG-Dateien exakt unter den angezeigten Pfaden im <code>public</code> Ordner.
            </div>
        </div>
    );
};
