import React, { useState } from 'react';
import { X, Lock, LogIn } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const { login } = useApp();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            setPassword('');
            setError(false);
            onClose();
        } else {
            setError(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#2a1215] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transition-colors duration-200 border border-[#ffef43]/20">
                <div className="p-6 border-b border-[#ffef43]/10 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#ffef43] flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[#ffef43]" />
                        Área Administrativa
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#361b1c] rounded-full transition-colors text-[#ffef43]/70 hover:text-[#ffef43]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                            Senha de Acesso
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            className={`w-full px-4 py-2 rounded-lg border ${error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#ffef43]/30 focus:border-[#ffef43]'
                                } bg-[#361b1c] text-white placeholder-white/30 focus:outline-none transition-colors`}
                            placeholder="Digite a senha..."
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-red-500 mt-1">Senha incorreta. Tente novamente.</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#ffef43] hover:bg-[#c89800] text-[#2a1215] font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4" />
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};
