
import React, { useState, useEffect } from 'react';
import { fetchAllSaves, overwriteUserSave, UserSaveData } from '../services/adminService';
import { X, Save, RefreshCw, Search, Database, AlertTriangle, User, ShieldAlert, Cpu } from 'lucide-react';
import { useAssistant } from '../context/AssistantContext';

interface AdminDashboardProps {
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const [users, setUsers] = useState<UserSaveData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSaveData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { triggerEvent } = useAssistant(); // K.O.R.A. Integration

    // Editor States (Text areas for raw JSON)
    const [gameJson, setGameJson] = useState('');
    const [invJson, setInvJson] = useState('');
    const [spireJson, setSpireJson] = useState('');
    
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAllSaves();
            setUsers(data);
        } catch (e: any) {
            setStatusMsg('Error fetching users: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = (user: UserSaveData) => {
        setSelectedUser(user);
        setGameJson(JSON.stringify(user.game_state, null, 2));
        setInvJson(JSON.stringify(user.inventory_state, null, 2));
        setSpireJson(JSON.stringify(user.spire_state, null, 2));
        setStatusMsg('');
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        if (!confirm(`WARNUNG: Du bist dabei, die Daten von User ${selectedUser.user_id} zu überschreiben. Dies kann nicht rückgängig gemacht werden.`)) return;

        try {
            const newGame = JSON.parse(gameJson);
            const newInv = JSON.parse(invJson);
            const newSpire = JSON.parse(spireJson);

            await overwriteUserSave(selectedUser.user_id, {
                game_state: newGame,
                inventory_state: newInv,
                spire_state: newSpire
            });

            setStatusMsg('✅ Daten erfolgreich gespeichert!');
            triggerEvent('admin_action', 'Datenbank-Manipulation detektiert. Ich sehe alles.');
            loadUsers(); // Refresh
        } catch (e: any) {
            setStatusMsg('❌ Fehler beim Speichern: ' + e.message);
        }
    };

    // Quick Action: Add 10k Credits
    const injectResources = () => {
        try {
            const current = JSON.parse(gameJson);
            current.resources.credits = (current.resources.credits || 0) + 10000;
            current.resources.nanosteel = (current.resources.nanosteel || 0) + 5000;
            setGameJson(JSON.stringify(current, null, 2));
            setStatusMsg('Ressourcen im Editor hinzugefügt (Klicke Speichern zum Anwenden)');
            triggerEvent('admin_cheat', 'Ressourcen-Injektion. Wie unkreativ.');
        } catch (e) {
            setStatusMsg('JSON Parse Error');
        }
    };

    // Quick Action: Reset Inventory
    const fixInventory = () => {
        try {
            const current = JSON.parse(invJson);
            if (!current.equipment) current.equipment = [];
            if (!current.consumables) current.consumables = [];
            if (!current.materials) current.materials = {};
            setInvJson(JSON.stringify(current, null, 2));
            setStatusMsg('Inventar Struktur repariert');
        } catch (e) { setStatusMsg('JSON Error'); }
    };

    const filteredUsers = users.filter(u => u.user_id.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[200] bg-black text-green-500 font-mono flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-green-800 flex justify-between items-center bg-black/90">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 animate-pulse text-red-500" />
                    <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-red-500">Overwatch Command</h1>
                    <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900">ADMIN ACCESS GRANTED</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={loadUsers} className="flex items-center gap-2 hover:text-white"><RefreshCw className="w-4 h-4" /> REFRESH</button>
                    <button onClick={onClose} className="flex items-center gap-2 hover:text-white text-red-500"><X className="w-6 h-6" /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar List */}
                <div className="w-1/4 border-r border-green-900/50 flex flex-col bg-black">
                    <div className="p-2 border-b border-green-900/50">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 w-4 h-4 text-green-700" />
                            <input 
                                type="text" 
                                placeholder="Search UUID..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-black border border-green-900 rounded p-2 pl-8 text-sm text-green-400 focus:outline-none focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center animate-pulse">Scanning Database...</div>
                        ) : (
                            filteredUsers.map(u => (
                                <button 
                                    key={u.user_id}
                                    onClick={() => handleSelectUser(u)}
                                    className={`w-full text-left p-3 border-b border-green-900/30 hover:bg-green-900/20 transition-colors flex items-center gap-3 ${selectedUser?.user_id === u.user_id ? 'bg-green-900/30 border-l-4 border-l-green-500' : ''}`}
                                >
                                    <User className="w-4 h-4 opacity-50" />
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold truncate">{u.user_id}</div>
                                        <div className="text-[10px] opacity-50">{new Date(u.updated_at).toLocaleString()}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-gray-900/50 relative">
                    {selectedUser ? (
                        <>
                            {/* Toolbar */}
                            <div className="p-2 bg-black border-b border-green-900/50 flex items-center gap-4">
                                <span className="text-xs text-slate-500 uppercase">Target: {selectedUser.user_id}</span>
                                <div className="h-6 w-px bg-green-900/50"></div>
                                <button onClick={injectResources} className="px-3 py-1 text-xs bg-blue-900/30 text-blue-400 border border-blue-800 rounded hover:bg-blue-900/50 flex gap-2 items-center"><Database className="w-3 h-3"/> +Res</button>
                                <button onClick={fixInventory} className="px-3 py-1 text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded hover:bg-yellow-900/50 flex gap-2 items-center"><Cpu className="w-3 h-3"/> Fix Inv</button>
                                <div className="flex-1"></div>
                                {statusMsg && <span className="text-xs font-bold animate-pulse">{statusMsg}</span>}
                                <button onClick={handleSave} className="px-6 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-500 shadow-[0_0_10px_red] flex gap-2 items-center"><Save className="w-4 h-4"/> DATABASE OVERWRITE</button>
                            </div>

                            {/* JSON Editors */}
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-bold text-sm bg-green-900/20 p-1 border-l-2 border-green-500">GAME STATE (Economy)</h3>
                                    <textarea 
                                        value={gameJson}
                                        onChange={e => setGameJson(e.target.value)}
                                        className="flex-1 bg-black border border-green-900/50 text-xs font-mono text-green-300 p-2 rounded focus:border-green-500 outline-none resize-none"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-bold text-sm bg-blue-900/20 p-1 border-l-2 border-blue-500 text-blue-400">INVENTORY STATE</h3>
                                    <textarea 
                                        value={invJson}
                                        onChange={e => setInvJson(e.target.value)}
                                        className="flex-1 bg-black border border-blue-900/50 text-xs font-mono text-blue-300 p-2 rounded focus:border-blue-500 outline-none resize-none"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-bold text-sm bg-purple-900/20 p-1 border-l-2 border-purple-500 text-purple-400">SPIRE STATE</h3>
                                    <textarea 
                                        value={spireJson}
                                        onChange={e => setSpireJson(e.target.value)}
                                        className="flex-1 bg-black border border-purple-900/50 text-xs font-mono text-purple-300 p-2 rounded focus:border-purple-500 outline-none resize-none"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-green-900">
                            <ShieldAlert className="w-24 h-24 mb-4 opacity-20" />
                            <p className="text-xl font-bold uppercase tracking-widest">Select a User Protocol</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
