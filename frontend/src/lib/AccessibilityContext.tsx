"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  isHighContrast: boolean;
  setIsHighContrast: (v: boolean) => void;
  isReducedMotion: boolean;
  setIsReducedMotion: (v: boolean) => void;
  globalLanguage: string;
  setGlobalLanguage: (v: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  isHighContrast: false,
  setIsHighContrast: () => {},
  isReducedMotion: false,
  setIsReducedMotion: () => {},
  globalLanguage: 'English',
  setGlobalLanguage: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [globalLanguage, setGlobalLanguage] = useState('English');

  useEffect(() => {
    // Check OS preferences for reduced motion on mount
    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(motionQuery.matches);
    }
  }, []);

  return (
    <AccessibilityContext.Provider value={{
      isHighContrast, setIsHighContrast,
      isReducedMotion, setIsReducedMotion,
      globalLanguage, setGlobalLanguage
    }}>
      <div 
        className={`
          high-contrast 
          ${isReducedMotion ? 'reduce-motion' : ''}
        `}
        style={{ direction: globalLanguage === 'Arabic' ? 'rtl' : 'ltr' }}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};
