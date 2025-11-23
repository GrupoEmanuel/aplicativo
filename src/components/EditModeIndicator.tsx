import React from 'react';
import { Settings, X } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const EditModeIndicator: React.FC = () => {
    const { isEditMode, logout } = useApp();

    if (!isEditMode) return null;

    return (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-amber-100 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-bottom-5">
            <Settings className="w-4 h-4 text-amber-700 dark:text-amber-400 animate-spin-slow" />
            <span className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">Modo Edição</span>
            <button
                onClick={logout}
                className="ml-2 p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full transition-colors text-amber-700 dark:text-amber-400"
                title="Sair do Modo Edição"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
};
