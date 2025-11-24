import React, { useState } from 'react';
import { X, Plus, Music, Trash2, ChevronLeft, ArrowUp, ArrowDown, Copy, Share2 } from 'lucide-react';
import { useLocalUserData } from '../hooks/useLocalUserData';
import { useApp } from '../store/AppContext';
import { MusicItem } from './MusicItem';

interface ListsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ListsModal: React.FC<ListsModalProps> = ({ isOpen, onClose }) => {
    const { playlists, createPlaylist, deletePlaylist, removeFromPlaylist, reorderPlaylist } = useLocalUserData();
    const { musicList } = useApp();
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [confirmRemove, setConfirmRemove] = useState<{ playlistId: string; musicId: string; musicTitle: string } | null>(null);
    const [shareSuccess, setShareSuccess] = useState(false);

    if (!isOpen) return null;

    const handleCreateList = () => {
        if (newListName.trim()) {
            createPlaylist(newListName.trim());
            setNewListName('');
            setIsCreating(false);
        }
    };

    const generateShareUrl = (playlist: { name: string; musicIds: string[] }) => {
        const musicIds = playlist.musicIds.join(',');
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#/musicas?playlist=${encodeURIComponent(playlist.name)}&songs=${musicIds}`;
    };

    const handleCopyLink = async (playlist: { name: string; musicIds: string[] }) => {
        const shareUrl = generateShareUrl(playlist);

        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert(`Link da playlist:\n${shareUrl}`);
        }
    };

    const handleNativeShare = async (playlist: { name: string; musicIds: string[] }) => {
        const shareUrl = generateShareUrl(playlist);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Playlist: ${playlist.name}`,
                    text: `Confira essa playlist com ${playlist.musicIds.length} músicas do Grupo Emanuel!`,
                    url: shareUrl
                });
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            handleCopyLink(playlist);
        }
    };

    const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

    const playlistSongs = selectedPlaylist
        ? selectedPlaylist.musicIds.map(id => musicList.find(m => m.id === id)).filter(Boolean)
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#2a1215] w-full max-w-lg max-h-[80vh] rounded-2xl border border-[#ffef43]/20 flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[#ffef43]/10 flex items-center justify-between bg-[#361b1c]">
                    <div className="flex items-center gap-3">
                        {selectedPlaylist ? (
                            <button
                                onClick={() => setSelectedPlaylistId(null)}
                                className="p-1 -ml-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        ) : (
                            <Music className="w-6 h-6 text-[#ffef43]" />
                        )}
                        <h2 className="text-xl font-bold text-[#ffef43]">
                            {selectedPlaylist ? selectedPlaylist.name : 'Minhas Listas'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedPlaylist && (
                            <>
                                <button
                                    onClick={() => handleCopyLink(selectedPlaylist)}
                                    className="p-2 text-gray-400 hover:text-[#ffef43] transition-colors rounded-full hover:bg-[#ffef43]/10"
                                    title="Copiar link"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleNativeShare(selectedPlaylist)}
                                    className="p-2 text-gray-400 hover:text-[#ffef43] transition-colors rounded-full hover:bg-[#ffef43]/10"
                                    title="Compartilhar"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {selectedPlaylist ? (
                        <div className="space-y-3">
                            {playlistSongs.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p>Esta lista está vazia.</p>
                                    <p className="text-xs mt-2">Adicione músicas através do menu de contexto na biblioteca.</p>
                                </div>
                            ) : (
                                playlistSongs.map(music => (
                                    music && (
                                        <div key={music.id} className="bg-[#2a1215] rounded-lg border border-[#ffef43]/20 overflow-hidden">
                                            <MusicItem music={music} />
                                            {/* Playlist Controls */}
                                            <div className="px-3 py-1.5 flex items-center justify-between bg-[#361b1c]/30 border-t border-[#ffef43]/10">
                                                <div></div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            reorderPlaylist(selectedPlaylist.id, music.id, 'up');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                        title="Mover para cima"
                                                    >
                                                        <ArrowUp className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            reorderPlaylist(selectedPlaylist.id, music.id, 'down');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                        title="Mover para baixo"
                                                    >
                                                        <ArrowDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmRemove({ playlistId: selectedPlaylist.id, musicId: music.id, musicTitle: music.title });
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Remover da lista"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {isCreating ? (
                                <div className="bg-[#361b1c] p-4 rounded-xl border border-[#ffef43]/20 animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-sm font-medium text-[#ffef43] mb-2">Nova Lista</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            placeholder="Nome da lista..."
                                            className="flex-1 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffef43]"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                                        />
                                        <button
                                            onClick={handleCreateList}
                                            disabled={!newListName.trim()}
                                            className="px-4 py-2 bg-[#ffef43] text-[#2a1215] rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ffef43]/90"
                                        >
                                            Criar
                                        </button>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full py-3 border-2 border-dashed border-[#ffef43]/30 rounded-xl text-[#ffef43]/70 hover:text-[#ffef43] hover:border-[#ffef43] hover:bg-[#ffef43]/5 transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    Criar Nova Lista
                                </button>
                            )}

                            <div className="space-y-2">
                                {playlists.map(playlist => (
                                    <div
                                        key={playlist.id}
                                        onClick={() => setSelectedPlaylistId(playlist.id)}
                                        className="flex items-center justify-between p-4 bg-[#361b1c] hover:bg-[#361b1c]/80 border border-[#ffef43]/10 rounded-xl cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#ffef43]/10 flex items-center justify-center">
                                                <Music className="w-5 h-5 text-[#ffef43]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{playlist.name}</h3>
                                                <p className="text-xs text-gray-400">{playlist.musicIds.length} músicas</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyLink(playlist);
                                                }}
                                                className="p-2 text-gray-500 hover:text-[#ffef43] transition-colors opacity-0 group-hover:opacity-100"
                                                title="Copiar link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNativeShare(playlist);
                                                }}
                                                className="p-2 text-gray-500 hover:text-[#ffef43] transition-colors opacity-0 group-hover:opacity-100"
                                                title="Compartilhar"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Excluir a lista "${playlist.name}"?`)) {
                                                        deletePlaylist(playlist.id);
                                                    }
                                                }}
                                                className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmRemove && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#2a1215] border border-[#ffef43]/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-[#ffef43] mb-2">Remover da Lista?</h3>
                        <p className="text-gray-300 mb-6 text-sm">
                            Tem certeza que deseja remover <span className="font-semibold text-white">"{confirmRemove.musicTitle}"</span> desta lista?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmRemove(null)}
                                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    removeFromPlaylist(confirmRemove.playlistId, confirmRemove.musicId);
                                    setConfirmRemove(null);
                                }}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Success Notification */}
            {shareSuccess && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[70] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    <p className="font-medium flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Link copiado! Compartilhe com sua equipe
                    </p>
                </div>
            )}
        </div>
    );
};
