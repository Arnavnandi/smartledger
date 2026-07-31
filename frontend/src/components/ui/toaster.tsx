import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

export const Toaster: React.FC = () => {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="top-right"
      theme={resolvedTheme as 'light' | 'dark'}
      richColors
      closeButton
      toastOptions={{
        className: 'rounded-xl text-xs font-sans shadow-xl border border-slate-200 dark:border-slate-800',
      }}
    />
  );
};
