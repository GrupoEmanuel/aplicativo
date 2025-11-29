import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { driveService, type MusicMetadata, type NewsItem, type AgendaItem, type LocationItem } from '../services/drive';
import { storageService } from '../services/storage';
import { firebaseService } from '../services/firebase-service';
import { Network, type ConnectionStatus } from '@capacitor/network';

interface AppState {
    musicList: MusicMetadata[];
    newsList: NewsItem[];
    agendaList: AgendaItem[];
    locationsList: LocationItem[];
    isLoading: boolean;
    isOffline: boolean;
    isDarkMode: boolean;
    isEditMode: boolean;
    toggleTheme: () => void;
    login: (password: string) => boolean;
    logout: () => void;
    refreshData: () => Promise<void>;
    addMusic: (music: Omit<MusicMetadata, 'id'>) => Promise<void>;
    updateMusic: (music: MusicMetadata) => Promise<void>;
    deleteMusic: (id: string) => Promise<void>;
    addNews: (news: Omit<NewsItem, 'id'>) => Promise<void>;
    updateNews: (news: NewsItem) => Promise<void>;
    deleteNews: (id: string) => Promise<void>;
    addAgenda: (agenda: Omit<AgendaItem, 'id'>) => Promise<void>;
    updateAgenda: (agenda: AgendaItem) => Promise<void>;
    deleteAgenda: (id: string) => Promise<void>;
    moveMusic: (id: string, direction: 'up' | 'down') => Promise<void>;
    moveNews: (id: string, direction: 'up' | 'down') => Promise<void>;
    moveAgenda: (id: string, direction: 'up' | 'down') => Promise<void>;
    addLocation: (location: Omit<LocationItem, 'id'>) => Promise<void>;
    updateLocation: (location: LocationItem) => Promise<void>;
    deleteLocation: (id: string) => Promise<void>;
    moveLocation: (id: string, direction: 'up' | 'down') => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [musicList, setMusicList] = useState<MusicMetadata[]>([]);
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [agendaList, setAgendaList] = useState<AgendaItem[]>([]);
    const [locationsList, setLocationsList] = useState<LocationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await storageService.getPreference('theme');
            const isDark = savedTheme === null || savedTheme === 'dark';
            setIsDarkMode(isDark);
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };
        loadTheme();

        // Listen for network status changes
        Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
            console.log('Network status changed', status);
            setIsOffline(!status.connected);
            if (status.connected) {
                console.log('Reconnected! Refreshing data...');
                refreshData();
            }
        });

        // Check initial status
        Network.getStatus().then((status: ConnectionStatus) => {
            setIsOffline(!status.connected);
        });

        return () => {
            Network.removeAllListeners();
        };
    }, []);

    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            await storageService.setPreference('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            await storageService.setPreference('theme', 'light');
        }
    };

    const login = (password: string): boolean => {
        if (password === 'GP46mnl.') {
            setIsEditMode(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsEditMode(false);
    };

    const loadCachedData = async () => {
        try {
            const [cachedMusic, cachedNews, cachedAgenda, cachedLocations] = await Promise.all([
                storageService.get<MusicMetadata[]>('musicList'),
                storageService.get<NewsItem[]>('newsList'),
                storageService.get<AgendaItem[]>('agendaList'),
                storageService.get<LocationItem[]>('locationsList')
            ]);

            if (cachedMusic) setMusicList(cachedMusic);
            if (cachedNews) setNewsList(cachedNews);
            if (cachedAgenda) setAgendaList(cachedAgenda);
            if (cachedLocations) setLocationsList(cachedLocations);
        } catch (error) {
            console.error('Error loading cached data:', error);
        }
    };

    const refreshData = async () => {
        setIsLoading(true);
        try {
            console.log('🔄 Checking for updates...');

            const [musicDb, generalDb] = await Promise.all([
                driveService.fetchMusicDatabase(),
                driveService.fetchGeneralDatabase()
            ]);

            // --- Music Sync Logic ---
            if (musicDb) {
                const cachedVersion = await storageService.get<string>('music_lastUpdated');
                if (musicDb.lastUpdated !== cachedVersion) {
                    console.log('📥 New music data found. Updating...');

                    // Don't sort here - preserve order from Dropbox (allows manual reordering)
                    setMusicList(musicDb.music);
                    await storageService.set('musicList', musicDb.music);
                    await storageService.set('music_lastUpdated', musicDb.lastUpdated);
                } else {
                    console.log('✅ Music data is up to date.');
                }
            }

            // --- General (News/Agenda/Locations) Sync Logic ---
            if (generalDb) {
                const cachedVersion = await storageService.get<string>('general_lastUpdated');
                if (generalDb.lastUpdated !== cachedVersion) {
                    console.log('📥 New general data found. Updating...');

                    // Sort News: Pinned first, then Newest first
                    const sortedNews = generalDb.news.sort((a, b) => {
                        if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    });

                    // Sort Agenda: Pinned first, then Nearest first
                    const sortedAgenda = generalDb.agenda.sort((a, b) => {
                        if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                        const dateA = new Date(`${a.date}T${a.time}`);
                        const dateB = new Date(`${b.date}T${b.time}`);
                        return dateA.getTime() - dateB.getTime();
                    });

                    // Sort Locations: Pinned first, then Alphabetical
                    const locations = (generalDb.locations || []).sort((a, b) => {
                        if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                        return a.name.localeCompare(b.name);
                    });

                    setNewsList(sortedNews);
                    setAgendaList(sortedAgenda);
                    setLocationsList(locations);

                    await storageService.set('newsList', sortedNews);
                    await storageService.set('agendaList', sortedAgenda);
                    await storageService.set('locationsList', locations);
                    await storageService.set('general_lastUpdated', generalDb.lastUpdated);
                } else {
                    console.log('✅ General data is up to date.');
                }
            }

            setIsOffline(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsOffline(true);
        } finally {
            setIsLoading(false);
        }
    };


    // Helper to remove undefined fields (Firebase doesn't accept undefined)
    const cleanUndefinedFields = <T extends Record<string, any>>(obj: T): T => {
        const cleaned: any = {};
        for (const key in obj) {
            if (obj[key] !== undefined) {
                cleaned[key] = obj[key];
            }
        }
        return cleaned as T;
    };

    const addMusic = async (music: Omit<MusicMetadata, 'id'>) => {
        const newMusic = cleanUndefinedFields({
            ...music,
            id: Date.now().toString(),
            visible: true,
            pinned: false
        });
        const updatedList = [newMusic, ...musicList].sort((a, b) => {
            if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return a.title.localeCompare(b.title);
        });
        setMusicList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('musicList', updatedList);
        await storageService.set('music_lastUpdated', timestamp);

        // Save to Firebase (clean each music item)
        await firebaseService.saveMusicDatabase({
            music: updatedList.map(m => cleanUndefinedFields(m)),
            version: 1,
            lastUpdated: timestamp
        });
    };


    const updateMusic = async (music: MusicMetadata) => {
        const cleanedMusic = cleanUndefinedFields(music);
        const updatedList = musicList.map(item => item.id === cleanedMusic.id ? cleanedMusic : item)
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                return a.title.localeCompare(b.title);
            });
        setMusicList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('musicList', updatedList);
        await storageService.set('music_lastUpdated', timestamp);

        // Save to Firebase (clean each music item)
        await firebaseService.saveMusicDatabase({
            music: updatedList.map(m => cleanUndefinedFields(m)),
            version: 1,
            lastUpdated: timestamp
        });
    };

    const deleteMusic = async (id: string) => {
        const updatedList = musicList.filter(item => item.id !== id);
        setMusicList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('musicList', updatedList);
        await storageService.set('music_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveMusicDatabase({
            music: updatedList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const addNews = async (news: Omit<NewsItem, 'id'>) => {
        const newNews = { ...news, id: Date.now().toString(), visible: true, pinned: false };
        const updatedList = [newNews, ...newsList].sort((a, b) => {
            if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setNewsList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('newsList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: updatedList,
            agenda: agendaList,
            locations: locationsList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const updateNews = async (news: NewsItem) => {
        const updatedList = newsList.map(item => item.id === news.id ? news : item)
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
        setNewsList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('newsList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: updatedList,
            agenda: agendaList,
            locations: locationsList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const deleteNews = async (id: string) => {
        const updatedList = newsList.filter(item => item.id !== id);
        setNewsList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('newsList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: updatedList,
            agenda: agendaList,
            locations: locationsList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const addAgenda = async (agenda: Omit<AgendaItem, 'id'>) => {
        const newAgenda = { ...agenda, id: Date.now().toString(), visible: true, pinned: false };
        const updatedList = [...agendaList, newAgenda].sort((a, b) => {
            if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });
        setAgendaList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('agendaList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: newsList,
            agenda: updatedList,
            locations: locationsList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const updateAgenda = async (agenda: AgendaItem) => {
        const updatedList = agendaList.map(item => item.id === agenda.id ? agenda : item)
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
        setAgendaList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('agendaList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: newsList,
            agenda: updatedList,
            locations: locationsList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const deleteAgenda = async (id: string) => {
        const updatedList = agendaList.filter(item => item.id !== id);
        setAgendaList(updatedList);

        const timestamp = new Date().toISOString();

        // Save to local cache AND Firebase
        await storageService.set('agendaList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: newsList,
            agenda: updatedList,
            locations: locationsList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const moveMusic = async (_id: string, _direction: 'up' | 'down') => {
        console.warn('Manual move disabled due to enforced sorting');
    };

    const moveNews = async (_id: string, _direction: 'up' | 'down') => {
        console.warn('Manual move disabled due to enforced sorting');
    };

    const moveAgenda = async (_id: string, _direction: 'up' | 'down') => {
        console.warn('Manual move disabled due to enforced sorting');
    };

    const addLocation = async (location: Omit<LocationItem, 'id'>) => {
        const newLocation = { ...location, id: Date.now().toString(), visible: true, pinned: false };
        const updatedList = [...locationsList, newLocation].sort((a, b) => {
            if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return a.name.localeCompare(b.name);
        });
        setLocationsList(updatedList);

        const timestamp = new Date().toISOString();
        await storageService.set('locationsList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: newsList,
            agenda: agendaList,
            locations: updatedList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const updateLocation = async (location: LocationItem) => {
        const updatedList = locationsList.map(item => item.id === location.id ? location : item)
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                return a.name.localeCompare(b.name);
            });
        setLocationsList(updatedList);

        const timestamp = new Date().toISOString();
        await storageService.set('locationsList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: newsList,
            agenda: agendaList,
            locations: updatedList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const deleteLocation = async (id: string) => {
        const updatedList = locationsList.filter(item => item.id !== id);
        setLocationsList(updatedList);

        const timestamp = new Date().toISOString();
        await storageService.set('locationsList', updatedList);
        await storageService.set('general_lastUpdated', timestamp);

        // Save to Firebase
        await firebaseService.saveGeneralDatabase({
            news: newsList,
            agenda: agendaList,
            locations: updatedList,
            version: 1,
            lastUpdated: timestamp
        });
    };

    const moveLocation = async (_id: string, _direction: 'up' | 'down') => {
        console.warn('Manual move disabled due to enforced sorting');
    };

    useEffect(() => {
        loadCachedData().then(() => refreshData());
    }, []);

    return (
        <AppContext.Provider value={{
            musicList, newsList, agendaList, locationsList,
            isLoading, isOffline, isDarkMode, isEditMode,
            toggleTheme, login, logout, refreshData,
            addMusic, updateMusic, deleteMusic,
            addNews, updateNews, deleteNews,
            addAgenda, updateAgenda, deleteAgenda,
            moveMusic, moveNews, moveAgenda,
            addLocation, updateLocation, deleteLocation, moveLocation
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};


