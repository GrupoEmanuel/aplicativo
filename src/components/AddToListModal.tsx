import React, { useState } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { useLocalUserData } from '../hooks/useLocalUserData';

interface AddToListModalProps {
    isOpen: boolean;
    onClose: () => void;
    musicId: string | null;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({ isOpen, onClose, musicId }) => {
    const { playlists, createPlaylist, addToPlaylist } = useLocalUserData();
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');

    if (!isOpen || !musicId) return null;

    const handleCreateList = () => {
        if (newListName.trim()) {
            const newList = createPlaylist(newListName.trim());
            addToPlaylist(newList.id, musicId);
            setNewListName('');
            setIsCreating(false);
            onClose();
        }
    };

    const handleSelectPlaylist = (playlistId: string) => {
        addToPlaylist(playlistId, musicId);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#2a1215] w-full max-w-sm rounded-2xl border border-[#ffef43]/20 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[#ffef43]/10 flex items-center justify-between bg-[#361b1c]">
                    <h3 className="text-lg font-bold text-[#ffef43]">Adicionar à Lista</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {playlists.map(playlist => {
                        const isAlreadyInList = playlist.musicIds.includes(musicId);
                        return (
                            <button
                                key={playlist.id}
                                onClick={() => !isAlreadyInList && handleSelectPlaylist(playlist.id)}
                                disabled={isAlreadyInList}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isAlreadyInList
                                    ? 'bg-[#361b1c]/50 border-[#ffef43]/5 text-gray-500 cursor-default'
                                    : 'bg-[#361b1c] border-[#ffef43]/10 hover:border-[#ffef43]/50 text-white hover:bg-[#361b1c]/80'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#ffef43]/10 flex items-center justify-center">
                                        <Music className="w-4 h-4 text-[#ffef43]" />
                                    </div>
                                    <span className="font-medium">{playlist.name}</span>
                                </div>
                                {isAlreadyInList && <Check className="w-4 h-4 text-green-500" />}
                            </button>
                        );
                    })}

                    {isCreating ? (
                        <div className="bg-[#361b1c] p-3 rounded-xl border border-[#ffef43]/20 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="Nome da nova lista..."
                                className="w-full bg-[#2a1215] border border-[#ffef43]/20 rounded-lg px-23 py-2 text-white mb-2 focus:outline-none focus:border-[#ffef43]"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={handleCreateList}
                                    disabled={!newListName.trim()}
                                    className="flex-1 py-1.5 bg-[#ffef43] text-[#2a1215] rounded-lg font-bold text-sm disabled:opacity-50"
                                >
                                    Criar e Adicionar
                                </button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-3 border-2 border-dashed border-[#ffef43]/30 rounded-xl text-[#ffef43]/70 hover:text-[#ffef43] hover:border-[#ffef43] hover:bg-[#ffef43]/5 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Lista
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
