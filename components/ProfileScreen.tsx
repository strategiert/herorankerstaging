
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, LogOut, Save, Cloud, Database, 
  Trash2, Mail, Lock, Check, AlertCircle, RefreshCw, Key, X, Scan, FolderOpen, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithEmail, signUpWithEmail, signOut, signInWithGoogle, loadSaveGame, saveGameToCloud, isConfigured } from '../services/supabaseService';
import { useGame } from '../context/GameContext';
import { useInventory } from '../context/InventoryContext';
import { useSpire } from '../context/SpireContext';
import { AssetMonitor } from './AssetMonitor';
import { AdminDashboard } from './AdminDashboard';
import { checkIsAdmin } from '../services/adminService';

interface ProfileScreenProps {
  onClose: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose }) => {
  const { user, guestId, loading: authLoading } = useAuth();
  const { state: gameState, loadState } = useGame();
  const { inventory, loadInventory } = useInventory();
  const { currentFloor, highScore, loadSpireState } = useSpire();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showAssets, setShowAssets] = useState(false);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
      const check = async () => {
          const admin = await checkIsAdmin();
          setIsAdmin(admin);
      };
      check();
  }, [user]);

  // --- ACTIONS ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const { error } = authMode === 'signup' 
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (error) throw error;

      if (authMode === 'signup') {
        setMsg({ type: 'success', text: 'Bestätigungs-Email gesendet!' });
      } else {
        // Login successful, auto-reload happens via AuthContext
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Authentifizierung fehlgeschlagen.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if(error) setMsg({ type: 'error', text: error.message });
      setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  const handleForceSave = async () => {
    setLoading(true);
    const userId = user ? user.id : guestId;
    const saveData = {
        game: gameState,
        inventory: inventory,
        spire: { currentFloor, highScore }
    };
    const { success, error } = await saveGameToCloud(userId, saveData);
    if(success) setMsg({ type: 'success', text: 'Spielstand erfolgreich in der Cloud gesichert.' });
    else setMsg({ type: 'error', text: 'Speichern fehlgeschlagen.' });
    setLoading(false);
  };

  const handleForceLoad = async () => {
      if(!confirm("Lokale Daten werden überschrieben. Fortfahren?")) return;
      setLoading(true);
      const userId = user ? user.id : guestId;
      const data = await loadSaveGame(userId);
      if(data) {
          if (data.game) loadState(data.game);
          if (data.inventory) loadInventory(data.inventory);
          if (data.spire) loadSpireState(data.spire);
          setMsg({ type: 'success', text: 'Spielstand geladen.' });
      } else {
          setMsg({ type: 'error', text: 'Kein Spielstand in der Cloud gefunden.' });
      }
      setLoading(false);
  };

  const handleReset = () => {
      const confirmText = "RESET";
      const input = prompt(`WARNUNG: Dies löscht ALLE lokalen Daten.\nTippe "${confirmText}" zum Bestätigen.`);
      if (input === confirmText) {
          localStorage.clear();
          window.location.reload();
      }
  };

  // --- RENDER ---

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white`}>
              <Icon className="w-5 h-5" />
          </div>
          <div>
              <div className="text-xs text-slate-400 uppercase font-bold">{label}</div>
              <div className="text-lg font-black text-white">{value}</div>
          </div>
      </div>
  );

  const CloseButton = () => (
    <button 
        onClick={onClose} 
        className="fixed top-4 left-4 z-[100] w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 border border-slate-700 shadow-xl active:scale-95 transition-all"
        aria-label="Schließen"
    >
        <X className="w-6 h-6" />
    </button>
  );

  if (showAdmin) {
      return <AdminDashboard onClose={() => setShowAdmin(false)} />;
  }

  // --- LOADING STATE ---
  if (authLoading) {
    return (
        <div className="h-full bg-slate-950 flex flex-col items-center justify-center relative">
            <CloseButton />
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500">
                    <Scan className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-blue-400 font-mono text-sm tracking-widest uppercase">
                    Identifiziere Commander...
                </div>
            </div>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full bg-slate-950 p-4 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center relative">
        <CloseButton />
        <div className="w-full max-w-md space-y-6 pt-12">
            <div className="text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50 transform rotate-3">
                    <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wider">Kommando-Zugriff</h1>
                <p className="text-slate-400 text-sm mt-2">Melde dich an, um deinen Fortschritt dauerhaft zu sichern.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex bg-slate-950 p-1 rounded-xl mb-6">
                    <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Login</button>
                    <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${authMode === 'signup' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Registrieren</button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {msg && <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{msg.type === 'success' ? <Check className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}{msg.text}</div>}
                    <div className="space-y-2">
                        <div className="relative"><Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 pointer-events-none" /><input id="email" name="email" type="email" autoComplete="username" placeholder="E-Mail Adresse" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-colors" required /></div>
                        <div className="relative"><Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500 pointer-events-none" /><input id="password" name="password" type="password" autoComplete={authMode === 'signup' ? "new-password" : "current-password"} placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-colors" required minLength={6} /></div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">{loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : (authMode === 'login' ? 'Anmelden' : 'Konto erstellen')}</button>
                </form>

                <div className="relative py-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Oder</span></div></div>
                <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl shadow hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"><span className="font-serif font-black text-blue-600">G</span> Google Login</button>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
                <button onClick={handleReset} className="text-red-500/60 hover:text-red-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"><Trash2 className="w-3 h-3" /> Lokalen Spielstand löschen</button>
                <div className="text-slate-700 text-[10px] font-mono">GUEST ID: {guestId}</div>
            </div>
        </div>
      </div>
    );
  }

  // --- USER VIEW (LOGGED IN) ---
  return (
    <div className="h-full bg-[#f0f4f8] flex flex-col relative">
        <CloseButton />

        {/* Header Profile */}
        <div className="bg-slate-900 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-8 bg-blue-500 blur-[80px] opacity-20 rounded-full"></div>
            <div className="relative z-10 flex flex-col items-center pt-4">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-700 mb-4 shadow-2xl overflow-hidden relative group">
                    {user.user_metadata.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-500 bg-slate-800">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-black tracking-tight">{user.user_metadata.full_name || 'Commander'}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm text-slate-400 font-mono">{user.email}</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 -mt-8 pb-20 overflow-y-auto custom-scrollbar space-y-6">
            
            <div className="grid grid-cols-2 gap-3">
                <StatCard label="Spire Floor" value={currentFloor} icon={Shield} color="bg-blue-600" />
                <StatCard label="Total Heroes" value={gameState.totalHeroes || 0} icon={User} color="bg-purple-600" />
            </div>

            {/* Cloud Controls */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-3 text-slate-800 mb-2">
                    <Cloud className="w-6 h-6 text-blue-500" />
                    <h3 className="font-black uppercase tracking-wide">Cloud Sync</h3>
                </div>
                
                {msg && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {msg.text}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleForceSave} disabled={loading} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex flex-col items-center gap-2 transition-all active:scale-95"><Save className="w-5 h-5" /> Upload</button>
                    <button onClick={handleForceLoad} disabled={loading} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex flex-col items-center gap-2 transition-all active:scale-95"><Database className="w-5 h-5" /> Download</button>
                </div>
                <div className="text-[10px] text-slate-400 text-center font-mono">Last Auto-Sync: {new Date(gameState.lastSaveTime).toLocaleTimeString()}</div>
            </div>

            {/* Asset Monitor Toggle */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div 
                    onClick={() => setShowAssets(!showAssets)}
                    className="flex justify-between items-center cursor-pointer mb-2"
                >
                    <h3 className="font-black uppercase tracking-wide text-slate-800 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-slate-400" /> Assets & Dateien
                    </h3>
                    <div className={`transform transition-transform ${showAssets ? 'rotate-180' : ''}`}>▼</div>
                </div>
                
                {showAssets && (
                    <div className="mt-4 animate-in slide-in-from-top-2">
                        <AssetMonitor />
                    </div>
                )}
            </div>

            {/* ADMIN BUTTON (HIDDEN IF NOT ADMIN) */}
            {isAdmin && (
                <button 
                    onClick={() => setShowAdmin(true)}
                    className="w-full p-4 bg-black text-red-500 font-mono font-bold uppercase tracking-widest border border-red-900 rounded-xl shadow-lg flex items-center justify-center gap-3 animate-pulse hover:bg-red-950 transition-colors"
                >
                    <ShieldAlert className="w-5 h-5" /> Overwatch Command
                </button>
            )}

            {/* System Status */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <h3 className="font-black uppercase tracking-wide text-slate-800 mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-slate-400" /> System Status
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-500 font-bold">Datenbank</span>
                        <span className={`font-black ${isConfigured() ? 'text-green-600' : 'text-red-500'}`}>
                            {isConfigured() ? 'VERBUNDEN' : 'OFFLINE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-3 pt-4">
                <button onClick={handleLogout} className="w-full py-4 bg-slate-200 text-slate-600 font-bold rounded-xl uppercase tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all"><LogOut className="w-5 h-5" /> Abmelden</button>
                <button onClick={handleReset} className="w-full py-4 border-2 border-red-100 text-red-400 font-bold rounded-xl uppercase tracking-wide text-xs flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-50"><Trash2 className="w-4 h-4" /> Reset Local Data</button>
            </div>
        </div>
    </div>
  );
};
