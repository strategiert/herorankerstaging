import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  guestId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate a persistent Guest ID if no user is logged in
const getGuestId = () => {
    let id = localStorage.getItem('infinite_arena_guest_id');
    if (!id) {
        id = 'guest_' + crypto.randomUUID();
        localStorage.setItem('infinite_arena_guest_id', id);
    }
    return id;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestId] = useState(getGuestId());

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
        try {
            // 1. Get Session
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
            }
        } catch (error) {
            console.error("Auth Init Error:", error);
        } finally {
            if (mounted) {
                // Short delay to prevent flash of guest content if session is restoring
                setTimeout(() => setLoading(false), 500); 
            }
        }
    };

    initAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false); // Immediately stop loading on change
      }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, guestId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};