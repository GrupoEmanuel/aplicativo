import React, { useState } from 'react';
import { X, Plus, Music, Trash2, ChevronLeft, ArrowUp, ArrowDown, Copy, Share2, Search, Download, CloudUpload, Globe, Eye } from 'lucide-react';
import { useLocalUserData } from '../hooks/useLocalUserData';
import { useApp } from '../store/AppContext';
import { MusicItem } from './MusicItem';
import { calculatePlaylistDuration, getPlaylistTotalDuration } from '../utils/playlistHelpers';
import { driveService } from '../services/drive';
import { firebaseService, type Playlist } from '../services/firebase-service';

interface ListsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ListsModal: React.FC<ListsModalProps> = ({ isOpen, onClose }) => {
    const { playlists, createPlaylist, deletePlaylist, removeFromPlaylist, reorderPlaylist, importPlaylist, userId } = useLocalUserData();
    const { musicList, isEditMode } = useApp();
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [confirmRemove, setConfirmRemove] = useState<{ playlistId: string; musicId: string; musicTitle: string } | null>(null);
    const [shareSuccess, setShareSuccess] = useState(false);

    // Custom Modal States
    const [confirmShare, setConfirmShare] = useState<{ id: string; name: string } | null>(null);
    const [confirmDeleteOnline, setConfirmDeleteOnline] = useState<Playlist | null>(null);
    const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null);

    // Online Search State
    const [isSearching, setIsSearching] = useState(false);
    const [onlinePlaylists, setOnlinePlaylists] = useState<Playlist[]>([]);
    const [isLoadingOnline, setIsLoadingOnline] = useState(false);
    const [isUploading, setIsUploading] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCreateList = () => {
        if (newListName.trim()) {
            createPlaylist(newListName.trim());
            setNewListName('');
            setIsCreating(false);
        }
    };

    const handleSearchOnline = async () => {
        setIsSearching(true);
        setIsLoadingOnline(true);
        try {
            const db = await driveService.fetchMusicDatabase();
            if (db && db.playlists) {
                setOnlinePlaylists(db.playlists);
            } else {
                setOnlinePlaylists([]);
            }
        } catch (error) {
            console.error('Error fetching online playlists:', error);
            alert('Erro ao buscar playlists online.');
        } finally {
            setIsLoadingOnline(false);
        }
    };

    const handleImportPlaylist = (playlist: Playlist) => {
        // Check if already exists
        const exists = playlists.some(p => p.name === playlist.name);
        if (exists) {
            alert('Já existe uma playlist com este nome.');
            return;
        }

        // Import using context
        importPlaylist(playlist as any);

        alert(`Playlist "${playlist.name}" importada com sucesso!`);
        setIsSearching(false);
    };

    const handleUploadPlaylist = async (playlist: any) => {
        setIsUploading(playlist.id);
        try {
            const playlistToUpload: Playlist = {
                id: playlist.id,
                name: playlist.name,
                musicIds: playlist.musicIds,
                isShared: true,
                ownerId: userId,
                createdAt: Date.now(),
                transpositions: playlist.transpositions || {}
            };

            await firebaseService.uploadPlaylist(playlistToUpload);
            setShareSuccess(true);
            setConfirmShare(null);
            setTimeout(() => setShareSuccess(false), 3000);
        } catch (error) {
            console.error('Error uploading playlist:', error);
            alert('Erro ao compartilhar playlist.');
        } finally {
            setIsUploading(null);
        }
    };

    const handleDeleteOnlinePlaylist = async (playlist: Playlist) => {
        try {
            await firebaseService.deleteOnlinePlaylist(playlist.id);
            setOnlinePlaylists(prev => prev.filter(p => p.id !== playlist.id));
            setConfirmDeleteOnline(null);
        } catch (error) {
            console.error('Error deleting online playlist:', error);
            alert('Erro ao remover playlist online.');
        }
    };

    const generateShareUrl = (playlist: { name: string; musicIds: string[] }) => {
        const musicIds = playlist.musicIds.join(',');
        return `https://grupoemanuel46-bb986.web.app/musicas?playlist=${encodeURIComponent(playlist.name)}&songs=${musicIds}`;
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
                    text: `Confira essa playlist com ${playlist.musicIds.length} músicas do Grupo Emanuel!\n\nToque no link abaixo para abrir no app:\n${shareUrl}`,
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
                {/*  Header */}
                <div className="p-3 border-b border-[#ffef43]/10 flex items-center justify-between bg-[#361b1c]">
                    <div className="flex items-center gap-2">
                        {selectedPlaylist || isSearching ? (
                            <button
                                onClick={() => {
                                    setSelectedPlaylistId(null);
                                    setIsSearching(false);
                                }}
                                className="p-1 -ml-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <Music className="w-5 h-5 text-[#ffef43]" />
                        )}
                        <h2 className="text-lg font-bold text-[#ffef43]">
                            {selectedPlaylist ? (
                                <div className="flex flex-col">
                                    <span>{selectedPlaylist.name}</span>
                                    <span className="text-xs font-normal text-[#c89800]">
                                        {calculatePlaylistDuration(playlistSongs)}
                                    </span>
                                </div>
                            ) : (isSearching ? 'Playlists Online' : 'Minhas Listas')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        {selectedPlaylist && (
                            <>
                                <button
                                    onClick={() => setConfirmShare({ id: selectedPlaylist.id, name: selectedPlaylist.name })}
                                    className="p-1.5 text-gray-400 hover:text-[#ffef43] transition-colors rounded-full hover:bg-[#ffef43]/10"
                                    title="Compartilhar Online"
                                >
                                    {isUploading === selectedPlaylist.id ? (
                                        <div className="w-4 h-4 border-2 border-[#ffef43] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <CloudUpload className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleCopyLink(selectedPlaylist)}
                                    className="p-1.5 text-gray-400 hover:text-[#ffef43] transition-colors rounded-full hover:bg-[#ffef43]/10"
                                    title="Copiar link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleNativeShare(selectedPlaylist)}
                                    className="p-1.5 text-gray-400 hover:text-[#ffef43] transition-colors rounded-full hover:bg-[#ffef43]/10"
                                    title="Compartilhar"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2">
                    {selectedPlaylist ? (
                        <div className="space-y-1.5">
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
                                            {/* Compact Controls - Setas separadas */}
                                            <div className="px-2 py-1 flex items-center justify-between bg-[#361b1c]/30 border-t border-[#ffef43]/10">
                                                <div></div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            reorderPlaylist(selectedPlaylist.id, music.id, 'up');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                        title="Mover para cima"
                                                    >
                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            reorderPlaylist(selectedPlaylist.id, music.id, 'down');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                        title="Mover para baixo"
                                                    >
                                                        <ArrowDown className="w-3.5 h-3.5" />
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
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                        </div>
                    ) : isSearching ? (
                        <div className="space-y-3">
                            {isLoadingOnline ? (
                                <div className="text-center py-8 text-gray-400 animate-pulse">
                                    Buscando playlists...
                                </div>
                            ) : onlinePlaylists.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p>Nenhuma playlist encontrada online.</p>
                                </div>
                            ) : (
                                onlinePlaylists.map(playlist => (
                                    <div
                                        key={playlist.id}
                                        className="flex items-center justify-between p-3 bg-[#361b1c] border border-[#ffef43]/10 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#ffef43]/10 flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-[#ffef43]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-sm">{playlist.name}</h3>
                                                <p className="text-xs text-gray-400">
                                                    {playlist.musicIds.length} músicas
                                                    {playlist.ownerId === userId && <span className="ml-2 text-green-400">(Sua)</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPreviewPlaylist(playlist)}
                                                className="p-2 bg-[#ffef43]/10 text-[#ffef43] rounded-lg hover:bg-[#ffef43]/20 transition-colors flex items-center gap-2"
                                                title="Visualizar"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {(playlist.ownerId === userId || isEditMode) && (
                                                <button
                                                    onClick={() => setConfirmDeleteOnline(playlist)}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                    title="Apagar Online"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleImportPlaylist(playlist)}
                                                className="p-2 bg-[#ffef43]/10 text-[#ffef43] rounded-lg hover:bg-[#ffef43]/20 transition-colors flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-xs font-bold">Importar</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {isCreating ? (
                                <div className="bg-[#361b1c] p-3 rounded-xl border border-[#ffef43]/20">
                                    <h3 className="text-sm font-medium text-[#ffef43] mb-2">Nova Lista</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            placeholder="Nome da lista..."
                                            className="flex-1 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#ffef43]"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                                        />
                                        <button
                                            onClick={handleCreateList}
                                            disabled={!newListName.trim()}
                                            className="px-3 py-1.5 bg-[#ffef43] text-[#2a1215] rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#ffef43]/90"
                                        >
                                            Criar
                                        </button>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="py-3 border-2 border-dashed border-[#ffef43]/30 rounded-xl text-[#ffef43]/70 hover:text-[#ffef43] hover:border-[#ffef43] hover:bg-[#ffef43]/5 transition-all flex flex-col items-center justify-center gap-1 font-medium"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="text-xs">Criar Nova</span>
                                    </button>
                                    <button
                                        onClick={handleSearchOnline}
                                        className="py-3 border-2 border-dashed border-blue-400/30 rounded-xl text-blue-400/70 hover:text-blue-400 hover:border-blue-400 hover:bg-blue-400/5 transition-all flex flex-col items-center justify-center gap-1 font-medium"
                                    >
                                        <Search className="w-5 h-5" />
                                        <span className="text-xs">Procurar Online</span>
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                {playlists.map(playlist => (
                                    <div
                                        key={playlist.id}
                                        onClick={() => setSelectedPlaylistId(playlist.id)}
                                        className="flex items-center justify-between p-3 bg-[#361b1c] hover:bg-[#361b1c]/80 border border-[#ffef43]/10 rounded-xl cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#ffef43]/10 flex items-center justify-center">
                                                <Music className="w-4 h-4 text-[#ffef43]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                                    {playlist.name}
                                                    {playlist.isShared && (
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                                                            Compartilhada
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-xs text-gray-400">
                                                    {playlist.musicIds.length} músicas • <span className="text-[#c89800]">{getPlaylistTotalDuration(musicList, playlist.musicIds)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmShare({ id: playlist.id, name: playlist.name });
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-[#ffef43] transition-colors"
                                                title="Compartilhar Online"
                                            >
                                                {isUploading === playlist.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-[#ffef43] border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <CloudUpload className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyLink(playlist);
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-[#ffef43] transition-colors"
                                                title="Copiar link"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNativeShare(playlist);
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-[#ffef43] transition-colors"
                                                title="Compartilhar"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Excluir a lista "${playlist.name}"?`)) {
                                                        deletePlaylist(playlist.id);
                                                    }
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
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

            {/* Share Success */}
            {shareSuccess && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[70] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
                    <p className="font-medium flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Playlist compartilhada!
                    </p>
                </div>
            )}

            {/* Confirm Share Modal */}
            {confirmShare && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#2a1215] border border-[#ffef43]/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-[#ffef43] mb-2">Compartilhar Playlist?</h3>
                        <p className="text-gray-300 mb-6 text-sm">
                            Deseja compartilhar a playlist <span className="font-semibold text-white">"{confirmShare.name}"</span> online?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmShare(null)}
                                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    const playlist = playlists.find(p => p.id === confirmShare.id);
                                    if (playlist) {
                                        await handleUploadPlaylist(playlist);
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-[#ffef43] text-[#2a1215] rounded-lg hover:bg-[#ffef43]/90 transition-colors font-medium"
                            >
                                Compartilhar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Online Modal */}
            {confirmDeleteOnline && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#2a1215] border border-[#ffef43]/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-[#ffef43] mb-2">Apagar Playlist Online?</h3>
                        <p className="text-gray-300 mb-6 text-sm">
                            Tem certeza que deseja apagar a playlist online <span className="font-semibold text-white">"{confirmDeleteOnline.name}"</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteOnline(null)}
                                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteOnlinePlaylist(confirmDeleteOnline)}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                                Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Playlist Modal */}
            {previewPlaylist && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#2a1215] w-full max-w-lg max-h-[80vh] rounded-2xl border border-[#ffef43]/20 flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-3 border-b border-[#ffef43]/10 flex items-center justify-between bg-[#361b1c]">
                            <h2 className="text-lg font-bold text-[#ffef43]">{previewPlaylist.name}</h2>
                            <button
                                onClick={() => setPreviewPlaylist(null)}
                                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="space-y-1.5">
                                {previewPlaylist.musicIds.map(musicId => {
                                    const music = musicList.find(m => m.id === musicId);
                                    return music ? (
                                        <div key={musicId} className="bg-[#361b1c] rounded-lg border border-[#ffef43]/10 p-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-white text-sm">{music.title}</h3>
                                                    <p className="text-xs text-gray-400">{music.artist}</p>
                                                </div>
                                                {music.key && (
                                                    <div className="px-2 py-1 bg-[#ffef43]/10 text-[#ffef43] rounded text-xs font-bold">
                                                        {music.key}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                        <div className="p-3 border-t border-[#ffef43]/10 bg-[#361b1c]/30">
                            <button
                                onClick={() => {
                                    handleImportPlaylist(previewPlaylist);
                                    setPreviewPlaylist(null);
                                }}
                                className="w-full py-2 bg-[#ffef43] text-[#2a1215] rounded-lg hover:bg-[#ffef43]/90 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Importar Playlist
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
