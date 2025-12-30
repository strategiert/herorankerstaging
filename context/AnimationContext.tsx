
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FlyingItem {
  id: string;
  icon: React.ReactNode;
  color: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

interface AnimationContextType {
  spawnFlyingItem: (rect: DOMRect, icon: React.ReactNode, color: string) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<FlyingItem[]>([]);

  const spawnFlyingItem = (startRect: DOMRect, icon: React.ReactNode, color: string) => {
    // Find the target (Inventory Icon)
    const targetEl = document.getElementById('inventory-target');
    if (!targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();

    const id = crypto.randomUUID();
    
    // Add item with start and end coordinates
    setItems(prev => [...prev, {
      id,
      icon,
      color,
      startX: startRect.left + startRect.width / 2 - 16, // Center horizontally (assuming 32px icon)
      startY: startRect.top + startRect.height / 2 - 16, // Center vertically
      targetX: targetRect.left + targetRect.width / 2 - 16,
      targetY: targetRect.top + targetRect.height / 2 - 16,
    }]);

    // Cleanup after animation
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 1000);
  };

  return (
    <AnimationContext.Provider value={{ spawnFlyingItem }}>
      {children}
      {/* RENDER LAYER */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {items.map(item => (
          <FlyingItemRenderer key={item.id} item={item} />
        ))}
      </div>
    </AnimationContext.Provider>
  );
};

const FlyingItemRenderer: React.FC<{ item: FlyingItem }> = ({ item }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    left: item.startX,
    top: item.startY,
    transform: 'scale(1.5)',
    opacity: 1,
    transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
  });

  useEffect(() => {
    // Trigger animation in next frame
    requestAnimationFrame(() => {
      setStyle({
        position: 'absolute',
        left: item.targetX,
        top: item.targetY,
        transform: 'scale(0.2)', // Shrink effect
        opacity: 0, // Fade out at the very end
        transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth ease-out
      });
    });
  }, [item]);

  return (
    <div style={style} className={`${item.color} drop-shadow-lg`}>
      <div className="text-4xl">{item.icon}</div>
    </div>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) throw new Error("useAnimation must be used within AnimationProvider");
  return context;
};
