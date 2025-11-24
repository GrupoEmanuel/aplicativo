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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#2a1215] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#ffef43]/20">
                <div className="bg-[#361b1c] p-6 text-white relative border-b border-[#ffef43]/20">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-[#ffef43] transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#ffef43]/10 p-3 rounded-full border border-[#ffef43]/20">
                            <Heart className="w-8 h-8 text-[#ffef43]" fill="currentColor" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-[#ffef43]">Faça sua Oferta</h2>
                    <p className="text-gray-300 text-center mt-2">
                        Sua contribuição ajuda a manter o Grupo Emanuel.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* PIX Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#ffef43]">
                            <QrCode className="w-5 h-5" />
                            <h3 className="font-semibold">Chave PIX</h3>
                        </div>
                        <div className="bg-[#361b1c] p-3 rounded-lg border border-[#ffef43]/20 flex items-center justify-between group hover:border-[#ffef43]/50 transition-colors">
                            <code className="text-sm text-gray-300 font-mono break-all mr-2">{pixKey}</code>
                            <button
                                onClick={() => copyToClipboard(pixKey)}
                                className="p-2 text-[#ffef43] hover:bg-[#ffef43]/10 rounded-md transition-colors"
                                title="Copiar PIX"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Bitcoin Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-orange-500">
                            <Bitcoin className="w-5 h-5" />
                            <h3 className="font-semibold">Carteira Bitcoin</h3>
                        </div>
                        <div className="bg-[#361b1c] p-3 rounded-lg border border-[#ffef43]/20 flex items-center justify-between group hover:border-[#ffef43]/50 transition-colors">
                            <code className="text-xs text-gray-300 font-mono break-all mr-2">{btcWallet}</code>
                            <button
                                onClick={() => copyToClipboard(btcWallet)}
                                className="p-2 text-[#ffef43] hover:bg-[#ffef43]/10 rounded-md transition-colors"
                                title="Copiar Endereço BTC"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#ffef43]/5 p-4 rounded-lg border border-[#ffef43]/10">
                        <p className="text-sm text-gray-300 text-center italic">
                            "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria."
                            <br />
                            <span className="font-semibold mt-2 block text-[#ffef43] not-italic">2 Coríntios 9:7</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
