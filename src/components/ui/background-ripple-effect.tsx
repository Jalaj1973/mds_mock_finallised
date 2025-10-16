"use client";
import React from "react";

export function BackgroundRippleEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid of interactive boxes */}
      <div className="grid grid-cols-12 grid-rows-8 h-full w-full gap-1 p-2">
        {Array.from({ length: 96 }).map((_, i) => (
          <div
            key={i}
            className="relative bg-neutral-200/20 dark:bg-neutral-800/20 rounded-sm hover:bg-neutral-300/30 dark:hover:bg-neutral-700/30 transition-colors duration-200 cursor-pointer group"
            style={{
              animationDelay: `${i * 0.05}s`,
            }}
          >
            {/* Ripple effect overlay */}
            <div className="absolute inset-0 rounded-sm opacity-0 group-active:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-400/30 dark:to-purple-400/30 animate-cell-ripple"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
