import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Playlist {
    id: string;
    name: string;
    musicIds: string[];
    createdAt: number;
    isShared?: boolean;
}

interface LocalUserContextType {
    localPins: string[];
    toggleLocalPin: (musicId: string) => void;
    isLocalPinned: (musicId: string) => boolean;
    playlists: Playlist[];
    createPlaylist: (name: string) => Playlist;
    deletePlaylist: (id: string) => void;
    addToPlaylist: (playlistId: string, musicId: string) => void;
    removeFromPlaylist: (playlistId: string, musicId: string) => void;
    reorderPlaylist: (playlistId: string, musicId: string, direction: 'up' | 'down') => void;
    savePlaylist: (name: string, musicIds: string[]) => void;
    importPlaylist: (playlist: Playlist) => void;
    userId: string;
}

const LocalUserContext = createContext<LocalUserContextType | undefined>(undefined);

export const LocalUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // User ID for ownership
    const [userId] = useState<string>(() => {
        const saved = localStorage.getItem('user_id');
        if (saved) return saved;
        const newId = crypto.randomUUID();
        localStorage.setItem('user_id', newId);
        return newId;
    });

    // Local Pins
    const [localPins, setLocalPins] = useState<string[]>(() => {
        const saved = localStorage.getItem('user_local_pins');
        return saved ? JSON.parse(saved) : [];
    });

    // Playlists
    const [playlists, setPlaylists] = useState<Playlist[]>(() => {
        const saved = localStorage.getItem('user_playlists');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('user_local_pins', JSON.stringify(localPins));
    }, [localPins]);

    useEffect(() => {
        localStorage.setItem('user_playlists', JSON.stringify(playlists));
    }, [playlists]);

    const toggleLocalPin = (musicId: string) => {
        setLocalPins(prev =>
            prev.includes(musicId)
                ? prev.filter(id => id !== musicId)
                : [...prev, musicId]
        );
    };

    const isLocalPinned = (musicId: string) => localPins.includes(musicId);

    const createPlaylist = (name: string) => {
        const newPlaylist: Playlist = {
            id: crypto.randomUUID(),
            name,
            musicIds: [],
            createdAt: Date.now()
        };
        setPlaylists(prev => [...prev, newPlaylist]);
        return newPlaylist;
    };

    const savePlaylist = (name: string, musicIds: string[]) => {
        const newPlaylist: Playlist = {
            id: crypto.randomUUID(),
            name,
            musicIds,
            createdAt: Date.now()
        };
        setPlaylists(prev => [...prev, newPlaylist]);
    };

    const importPlaylist = (playlist: Playlist) => {
        // Ensure we don't duplicate IDs if importing multiple times, though we check name in UI
        // We'll generate a new ID for local storage but keep the content
        const newPlaylist: Playlist = {
            ...playlist,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            isShared: true
        };
        setPlaylists(prev => [...prev, newPlaylist]);
    };

    const deletePlaylist = (id: string) => {
        setPlaylists(prev => prev.filter(p => p.id !== id));
    };

    const addToPlaylist = (playlistId: string, musicId: string) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId && !p.musicIds.includes(musicId)) {
                return { ...p, musicIds: [...p.musicIds, musicId] };
            }
            return p;
        }));
    };

    const removeFromPlaylist = (playlistId: string, musicId: string) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                return { ...p, musicIds: p.musicIds.filter(id => id !== musicId) };
            }
            return p;
        }));
    };

    const reorderPlaylist = (playlistId: string, musicId: string, direction: 'up' | 'down') => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                const currentIndex = p.musicIds.indexOf(musicId);
                if (currentIndex === -1) return p;

                const newMusicIds = [...p.musicIds];

                // Circular behavior - no limits
                if (direction === 'up') {
                    const newIndex = currentIndex === 0 ? newMusicIds.length - 1 : currentIndex - 1;
                    [newMusicIds[currentIndex], newMusicIds[newIndex]] = [newMusicIds[newIndex], newMusicIds[currentIndex]];
                } else {
                    const newIndex = currentIndex === newMusicIds.length - 1 ? 0 : currentIndex + 1;
                    [newMusicIds[currentIndex], newMusicIds[newIndex]] = [newMusicIds[newIndex], newMusicIds[currentIndex]];
                }

                return { ...p, musicIds: newMusicIds };
            }
            return p;
        }));
    };

    return (
        <LocalUserContext.Provider value={{
            localPins,
            toggleLocalPin,
            isLocalPinned,
            playlists,
            createPlaylist,
            deletePlaylist,
            addToPlaylist,
            removeFromPlaylist,
            reorderPlaylist,
            savePlaylist,
            importPlaylist,
            userId
        }}>
            {children}
        </LocalUserContext.Provider>
    );
};

export const useLocalUserData = () => {
    const context = useContext(LocalUserContext);
    if (context === undefined) {
        throw new Error('useLocalUserData must be used within a LocalUserProvider');
    }
    return context;
};
