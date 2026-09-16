import React from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Copy, Lock, Info } from 'lucide-react';

export const RelayToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none px-4 max-w-md w-full">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-[#202A30] dark:bg-[#182026] text-white text-xs sm:text-sm font-medium rounded-full shadow-lg border border-white/10 animate-fade-in pointer-events-auto transition-all"
          >
            {toast.icon === 'check' && <Check className="w-4 h-4 text-[#10B981]" />}
            {toast.icon === 'copy' && <Copy className="w-4 h-4 text-sky-400" />}
            {toast.icon === 'lock' && <Lock className="w-4 h-4 text-[#F05D48]" />}
            {toast.icon === 'info' && <Info className="w-4 h-4 text-amber-400" />}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
