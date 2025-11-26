import React, { useState } from 'react';
import { Heart, Settings } from 'lucide-react';
import { Agenda } from '../components/Agenda';
import { NewsFeed } from '../components/NewsFeed';
import { DonationModal } from '../components/DonationModal';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { EditModeIndicator } from '../components/EditModeIndicator';
import { AddItemModal } from '../components/AddItemModal';
import { PullToRefresh } from '../components/PullToRefresh';
import { useApp } from '../store/AppContext';

export const Home: React.FC = () => {
    const [isDonationOpen, setIsDonationOpen] = useState(false);
    const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [addItemType, setAddItemType] = useState<'news' | 'agenda'>('news');
    const [defaultAgendaType, setDefaultAgendaType] = useState<'ensaios' | 'escalas'>('ensaios');
    const { refreshData } = useApp();

    const openAddItem = (type: 'news' | 'agenda', agendaType?: 'ensaios' | 'escalas') => {
        setAddItemType(type);
        if (agendaType) setDefaultAgendaType(agendaType);
        setIsAddItemOpen(true);
    };

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#361b1c' }}>
            {/* Header */}
            <header className="shadow-sm sticky top-0 z-10" style={{ backgroundColor: '#2a1215' }}>
                <div className="px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#ffef43' }}>Grupo Emanuel</h1>
                        <p className="text-xs text-gray-400">Portal do Músico</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAdminLoginOpen(true)}
                            className="p-2 rounded-full hover:opacity-80 transition-opacity border"
                            style={{ backgroundColor: '#361b1c', color: '#ffef43', borderColor: 'rgba(255, 239, 67, 0.2)' }}
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsDonationOpen(true)}
                            className="p-2 rounded-full hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: 'rgba(255, 239, 67, 0.2)', color: '#ffef43' }}
                        >
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <PullToRefresh onRefresh={refreshData}>
                <main className="p-4">
                    <Agenda onAdd={(type) => openAddItem('agenda', type)} />
                    <NewsFeed />
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
                isOpen={isAddItemOpen}
                onClose={() => setIsAddItemOpen(false)}
                type={addItemType}
                defaultAgendaType={defaultAgendaType}
            />

            <EditModeIndicator />
        </div>
    );
};
