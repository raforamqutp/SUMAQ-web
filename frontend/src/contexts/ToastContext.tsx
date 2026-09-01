import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * ============================================================================
 * CONTEXTO GLOBAL: TOAST CONTEXT (Notificaciones Flotantes)
 * ============================================================================
 * Proporciona un sistema de alertas no invasivas que aparecen en la esquina
 * inferior derecha de la pantalla y desaparecen automáticamente a los 4.5s.
 * 
 * Métodos disponibles mediante useToast():
 * - toast.success('Título', 'Mensaje opcional') -> Verde
 * - toast.error('Título', 'Mensaje opcional')   -> Rojo
 * - toast.warning('Título', 'Mensaje opcional') -> Ámbar
 * - toast.info('Título', 'Mensaje opcional')    -> Tierra/Neutro
 * ============================================================================
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message),
    info: (title: string, message?: string) => addToast('info', title, message),
    warning: (title: string, message?: string) => addToast('warning', title, message),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
              t.type === 'success'
                ? 'bg-[#FAF8F5] border-[#8FA89B] text-[#2C2725]'
                : t.type === 'error'
                ? 'bg-[#FFF8F7] border-[#E8A090] text-[#5C2318]'
                : t.type === 'warning'
                ? 'bg-[#FFFDF5] border-[#E5C378] text-[#59420B]'
                : 'bg-[#F6F2EC] border-[#DFD0C0] text-[#2C2725]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#4D7A68]" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-[#C84B31]" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-[#8C6F55]" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.message && <p className="text-xs mt-0.5 opacity-90">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#8C6F55] hover:text-[#2C2725] shrink-0 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
