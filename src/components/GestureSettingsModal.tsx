import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { gestureDetectionService, type GestureType, type GestureConfig } from '../services/gestureDetection';

interface GestureSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GESTURE_OPTIONS: { value: GestureType; label: string }[] = [
    { value: 'nod_up', label: 'Aceno com a cabeça para cima' },
    { value: 'nod_yes', label: 'Aceno com a cabeça de afirmação' },
    { value: 'blink_right', label: 'Piscar olho direito' },
    { value: 'blink_left', label: 'Piscar olho esquerdo' },
    { value: 'none', label: 'Não atribuir' }
];

export const GestureSettingsModal: React.FC<GestureSettingsModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<GestureConfig>({
        toggleScroll: 'nod_up',
        skipHalfScreen: 'blink_right',
        closePerformance: 'blink_left',
        scrollCountdown: 5,
        cameraFacing: 'user'
    });

    useEffect(() => {
        if (isOpen) {
            const currentConfig = gestureDetectionService.getConfig();
            setConfig(currentConfig);
        }
    }, [isOpen]);

    const handleSave = async () => {
        await gestureDetectionService.saveConfig(config);
        onClose();
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#2a1215] border border-[#ffef43] rounded-lg max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[#ffef43] text-xl font-bold">Configurações de Gestos</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-[#361b1c] text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                    {/* Toggle Scroll */}
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 block">
                            Iniciar/Pausar Rolagem
                        </label>
                        <select
                            value={config.toggleScroll}
                            onChange={(e) => setConfig({ ...config, toggleScroll: e.target.value as GestureType })}
                            className="w-full p-2.5 rounded-lg bg-[#361b1c] border border-[#ffef43]/20 text-white focus:border-[#ffef43] focus:outline-none"
                        >
                            {GESTURE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Skip Half Screen */}
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 block">
                            Pular meia tela
                        </label>
                        <select
                            value={config.skipHalfScreen}
                            onChange={(e) => setConfig({ ...config, skipHalfScreen: e.target.value as GestureType })}
                            className="w-full p-2.5 rounded-lg bg-[#361b1c] border border-[#ffef43]/20 text-white focus:border-[#ffef43] focus:outline-none"
                        >
                            {GESTURE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Close Performance */}
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 block">
                            Fechar música
                        </label>
                        <select
                            value={config.closePerformance}
                            onChange={(e) => setConfig({ ...config, closePerformance: e.target.value as GestureType })}
                            className="w-full p-2.5 rounded-lg bg-[#361b1c] border border-[#ffef43]/20 text-white focus:border-[#ffef43] focus:outline-none"
                        >
                            {GESTURE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Scroll Countdown */}
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 block">
                            Contagem Regressiva (segundos)
                        </label>
                        <select
                            value={config.scrollCountdown}
                            onChange={(e) => setConfig({ ...config, scrollCountdown: Number(e.target.value) })}
                            className="w-full p-2.5 rounded-lg bg-[#361b1c] border border-[#ffef43]/20 text-white focus:border-[#ffef43] focus:outline-none"
                        >
                            {[0, 3, 5, 10, 15, 20, 30].map(val => (
                                <option key={val} value={val}>{val === 0 ? 'Sem contagem' : `${val}s`}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="w-full mt-6 p-3 rounded-lg bg-[#ffef43] text-[#2a1215] font-bold hover:bg-[#ffef43]/90 transition-colors"
                >
                    Salvar Configurações
                </button>
            </div>
        </div>,
        document.body
    );
};
