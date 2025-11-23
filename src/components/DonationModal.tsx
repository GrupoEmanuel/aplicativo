import React from 'react';
import { X, Copy, Heart, QrCode, Bitcoin } from 'lucide-react';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    // Mock data
    const pixKey = 'grupoemanuel@email.com';
    const btcWallet = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-colors duration-200">
                <div className="bg-[#ffef43] dark:bg-[#ffef43]/90 p-6 text-gray-900 relative transition-colors">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-700 hover:text-gray-900"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex justify-center mb-4">
                        <div className="bg-gray-900/20 p-3 rounded-full">
                            <Heart className="w-8 h-8 text-gray-900" fill="currentColor" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center">Faça sua Oferta</h2>
                    <p className="text-gray-800 dark:text-gray-900 text-center mt-2">
                        Sua contribuição ajuda a manter o Grupo Emanuel.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* PIX Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <QrCode className="w-5 h-5" />
                            <h3 className="font-semibold">Chave PIX</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                            <code className="text-sm text-gray-600 dark:text-gray-300 font-mono break-all mr-2">{pixKey}</code>
                            <button
                                onClick={() => copyToClipboard(pixKey)}
                                className="p-2 text-[#ffef43] dark:text-[#ffef43] hover:bg-[#ffef43]/10 dark:hover:bg-[#ffef43]/20 rounded-md transition-colors"
                                title="Copiar PIX"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Bitcoin Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400">
                            <Bitcoin className="w-5 h-5" />
                            <h3 className="font-semibold">Carteira Bitcoin</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                            <code className="text-xs text-gray-600 dark:text-gray-300 font-mono break-all mr-2">{btcWallet}</code>
                            <button
                                onClick={() => copyToClipboard(btcWallet)}
                                className="p-2 text-[#ffef43] dark:text-[#ffef43] hover:bg-[#ffef43]/10 dark:hover:bg-[#ffef43]/20 rounded-md transition-colors"
                                title="Copiar Endereço BTC"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#ffef43]/10 dark:bg-[#ffef43]/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-800 text-center">
                            "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria."
                            <br />
                            <span className="font-semibold mt-1 block">2 Coríntios 9:7</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
