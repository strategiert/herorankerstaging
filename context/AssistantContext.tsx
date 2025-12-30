
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateKoraComment } from '../services/geminiService';

interface AssistantContextType {
  message: string | null;
  isVisible: boolean;
  mood: 'neutral' | 'sarcastic' | 'happy' | 'annoyed';
  triggerEvent: (action: string, context?: string) => void;
  closeMessage: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mood, setMood] = useState<'neutral' | 'sarcastic' | 'happy' | 'annoyed'>('neutral');
  const [lastTriggerTime, setLastTriggerTime] = useState(0);

  const closeMessage = () => setIsVisible(false);

  const triggerEvent = useCallback(async (action: string, context: string = '') => {
    const now = Date.now();
    // Cooldown logic: Don't trigger too often (e.g., 20 seconds) unless critical
    if (now - lastTriggerTime < 20000 && !action.includes('error')) return;

    setLastTriggerTime(now);
    
    // Sometimes K.O.R.A. just ignores you (flavor)
    if (Math.random() > 0.8) return;

    try {
        setMood('neutral'); // Thinking state
        const comment = await generateKoraComment(action, context);
        setMessage(comment);
        setMood('sarcastic'); // Default KORA mood
        setIsVisible(true);
        
        // Auto-hide after 8 seconds
        setTimeout(() => setIsVisible(false), 8000);
    } catch (e) {
        console.error("KORA Error:", e);
    }
  }, [lastTriggerTime]);

  return (
    <AssistantContext.Provider value={{ message, isVisible, mood, triggerEvent, closeMessage }}>
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used within AssistantProvider");
  return context;
};
