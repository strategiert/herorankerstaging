import React, { useState } from 'react';
import { Shield, LogIn, AlertTriangle, User, LogOut, Check, Mail, Lock } from 'lucide-react';
import { signInWithGoogle, signOut, signInWithEmail, signUpWithEmail } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { user, guestId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
        setErrorMsg("Google Login fehlgeschlagen: " + error.message);
        setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      if (!email || !password) {
          setErrorMsg("Bitte fülle alle Felder aus.");
          setLoading(false);
          return;
      }

      if (isSignUp) {
          const { data, error } = await signUpWithEmail(email, password);
          if (error) {
              setErrorMsg(error.message);
          } else {
              setSuccessMsg("Registrierung erfolgreich! Bitte überprüfe deine E-Mails zur Bestätigung.");
              // Don't close immediately so they see the message
          }
      } else {
          const { data, error } = await signInWithEmail(email, password);
          if (error) {
              setErrorMsg("Login fehlgeschlagen: " + error.message);
          } else {
              // Success handled by AuthContext
              onClose();
          }
      }
      setLoading(false);
  };

  const handleLogout = async () => {
      setLoading(true);
      await signOut();
      setLoading(false);
      onClose();
      window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-400">
            <Shield className="w-5 h-5" />
            <h2 className="font-bold font-mono tracking-wider">IDENTITÄTS-PROTOKOLL</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6">
          
          {user ? (
              // LOGGED IN STATE
              <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                      {user.user_metadata.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-green-500" />
                      ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl uppercase">
                              {user.email?.charAt(0)}
                          </div>
                      )}
                      <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate">{user.user_metadata.full_name || user.email}</h3>
                          <p className="text-xs text-green-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Verbunden & Synchronisiert
                          </p>
                      </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 rounded-xl font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? '...' : <><LogOut className="w-4 h-4" /> Abmelden</>}
                  </button>
              </div>
          ) : (
              // GUEST / LOGIN STATE
              <div className="space-y-4">
                  
                  {/* Google Button */}
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                        'Verbinde...' 
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Mit Google fortfahren
                        </>
                    )}
                  </button>

                  <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Oder mit E-Mail</span></div>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-3">
                      {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">{errorMsg}</div>}
                      {successMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs">{successMsg}</div>}

                      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mb-4">
                          <button 
                            type="button" 
                            onClick={() => setIsSignUp(false)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                              LOGIN
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsSignUp(true)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                              REGISTRIEREN
                          </button>
                      </div>

                      <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="email" 
                            name="email"
                            id="email"
                            autoComplete="email"
                            placeholder="E-Mail Adresse" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>
                      <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="password"
                            name="password"
                            id="password"
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            placeholder="Passwort" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>

                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wide shadow-lg transition-all active:scale-95"
                      >
                        {loading ? 'Verarbeite...' : (isSignUp ? 'Account erstellen' : 'Anmelden')}
                      </button>
                  </form>

                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 mt-4">
                      <p className="text-[10px] text-slate-500 mb-1 font-mono uppercase">Gast-ID (Lokal)</p>
                      <code className="text-xs text-slate-400 font-mono break-all">{guestId}</code>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};