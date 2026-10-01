import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-500">
      <div className="bg-slate-900/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
