import React, { useState } from 'react';
import { Search, Heart, Settings, Plus } from 'lucide-react';
import { MusicItem } from '../components/MusicItem';
import { DonationModal } from '../components/DonationModal';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { AddItemModal } from '../components/AddItemModal';
import { PullToRefresh } from '../components/PullToRefresh';
import { EditModeIndicator } from '../components/EditModeIndicator';
import { useApp } from '../store/AppContext';

export const MusicLibrary: React.FC = () => {
    const { musicList, isEditMode, refreshData } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDonationOpen, setIsDonationOpen] = useState(false);
    const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
    const [isAddMusicOpen, setIsAddMusicOpen] = useState(false);

    const filteredMusic = musicList.filter(music =>
        (isEditMode || music.visible) &&
        (music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            music.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-brand-bg-page pb-20">
            {/* Header */}
            <header className="bg-brand-bg-card shadow-sm sticky top-0 z-10">
                <div className="px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-brand-primary">Biblioteca Musical</h1>
                        <p className="text-xs text-gray-400">Grupo Emanuel</p>
                    </div>
                    <div className="flex gap-3">
                        {isEditMode && (
                            <button
                                onClick={() => setIsAddMusicOpen(true)}
                                className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-primary/80 transition-colors shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsAdminLoginOpen(true)}
                            className="p-2 bg-brand-bg-page text-brand-primary rounded-full hover:bg-brand-primary/20 transition-colors border border-brand-primary/20"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsDonationOpen(true)}
                            className="p-2 bg-brand-primary/20 text-brand-primary rounded-full hover:bg-brand-primary/30 transition-colors"
                        >
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar música ou artista..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-brand-bg-page border border-brand-primary/20 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-white placeholder-gray-400 transition-colors"
                        />
                    </div>
                </div>
            </header>

            <PullToRefresh onRefresh={refreshData}>
                <main className="p-4">
                    {filteredMusic.length > 0 ? (
                        <div className="space-y-3">
                            {filteredMusic.map(music => (
                                <MusicItem key={music.id} music={music} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                            <p className="mt-4">Carregando músicas...</p>
                        </div>
                    )}
                </main>
            </PullToRefresh>

            <DonationModal
                isOpen={isDonationOpen}
                onClose={() => setIsDonationOpen(false)}
            />

            <AdminLoginModal
                isOpen={isAdminLoginOpen}
                onClose={() => setIsAdminLoginOpen(false)}
            />

            <AddItemModal
                isOpen={isAddMusicOpen}
                onClose={() => setIsAddMusicOpen(false)}
                type="music"
            />

            <EditModeIndicator />
        </div>
    );
};
