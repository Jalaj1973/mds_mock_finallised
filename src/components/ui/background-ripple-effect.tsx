"use client";
import React, { useCallback, useState } from "react";

interface CellRipple {
  id: number;
  delay: number;
}

export function BackgroundRippleEffect() {
  const [ripples, setRipples] = useState<CellRipple[]>([]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple: CellRipple = {
      id: Date.now() + Math.random(),
      delay: Math.random() * 200,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 1000);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid of cells */}
      <div className="grid grid-cols-12 grid-rows-8 h-full w-full gap-1 opacity-30">
        {Array.from({ length: 96 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-sm hover:from-primary/20 hover:to-secondary/20 dark:hover:from-primary/30 dark:hover:to-secondary/30 transition-all duration-300 cursor-pointer"
            onMouseDown={createRipple}
          >
            {ripples.map((ripple) => (
              <div
                key={ripple.id}
                className="absolute inset-0 animate-cell-ripple bg-gradient-to-br from-primary/40 to-secondary/40 dark:from-primary/50 dark:to-secondary/50 rounded-sm"
                style={{
                  animationDelay: `${ripple.delay}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
