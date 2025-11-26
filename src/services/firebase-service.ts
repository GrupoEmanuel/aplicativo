import { ref, get, set } from "firebase/database";
import { database } from '../config/firebase-config';
import type { MusicMetadata, NewsItem, AgendaItem, LocationItem } from './drive';

export interface GeneralDatabase {
    news: NewsItem[];
    agenda: AgendaItem[];
    locations: LocationItem[];
    version: number;
    lastUpdated: string;
}

export interface Playlist {
    id: string;
    name: string;
    musicIds: string[];
    isShared?: boolean;
    ownerId?: string;
    createdAt?: number;
}

export interface MusicDatabase {
    music: MusicMetadata[];
    playlists?: Playlist[];
    version: number;
    lastUpdated: string;
}

export const firebaseService = {
    /**
     * Fetch general database from Firebase Realtime Database
     * Returns null if offline or error occurs (AppContext will use cached data)
     */
    async fetchGeneralDatabase(): Promise<GeneralDatabase | null> {
        try {
            console.log('📥 Fetching general database from Firebase...');

            const generalRef = ref(database, 'geral');
            const snapshot = await get(generalRef);

            if (snapshot.exists()) {
                const data = snapshot.val() as GeneralDatabase;
                console.log('✅ Firebase data loaded. Version:', data.lastUpdated);
                console.log('📊 News count:', data.news?.length, 'Agenda count:', data.agenda?.length);
                return data;
            } else {
                console.warn('⚠️ No data available at Firebase path: geral');
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to fetch from Firebase:', error);
            console.log('📂 Will use cached version (handled by AppContext)');
            return null;
        }
    },

    /**
     * Fetch music database from Firebase Realtime Database
     * Returns null if offline or error occurs (AppContext will use cached data)
     */
    async fetchMusicDatabase(): Promise<MusicDatabase | null> {
        try {
            console.log('📥 Fetching music database from Firebase...');

            const musicRef = ref(database, 'musicas');
            const snapshot = await get(musicRef);

            if (snapshot.exists()) {
                const data = snapshot.val() as MusicDatabase;
                console.log('✅ Firebase data loaded. Version:', data.lastUpdated);
                console.log('📊 Music count:', data.music?.length, 'Playlists count:', data.playlists?.length);
                return data;
            } else {
                console.warn('⚠️ No data available at Firebase path: musicas');
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to fetch from Firebase:', error);
            console.log('📂 Will use cached version (handled by AppContext)');
            return null;
        }
    },

    /**
     * Save general database to Firebase Realtime Database
     * Updates lastUpdated timestamp automatically
     */
    async saveGeneralDatabase(data: GeneralDatabase): Promise<boolean> {
        try {
            console.log('💾 Saving general database to Firebase...');

            // Update timestamp
            data.lastUpdated = new Date().toISOString();

            const generalRef = ref(database, 'geral');
            await set(generalRef, data);

            console.log('✅ Saved to Firebase. New version:', data.lastUpdated);
            return true;
        } catch (error) {
            console.error('❌ Error saving to Firebase:', error);
            const errorMsg = error instanceof Error ? error.message : 'Erro ao salvar dados';
            alert(`Erro ao salvar: ${errorMsg}`);
            return false;
        }
    },

    /**
     * Save music database to Firebase Realtime Database
     * Updates lastUpdated timestamp automatically
     */
    async saveMusicDatabase(data: MusicDatabase): Promise<boolean> {
        try {
            console.log('💾 Saving music database to Firebase...');

            // Update timestamp
            data.lastUpdated = new Date().toISOString();

            const musicRef = ref(database, 'musicas');
            await set(musicRef, data);

            console.log('✅ Saved to Firebase. New version:', data.lastUpdated);
            return true;
        } catch (error) {
            console.error('❌ Error saving to Firebase:', error);
            const errorMsg = error instanceof Error ? error.message : 'Erro ao salvar dados';
            alert(`Erro ao salvar: ${errorMsg}`);
            return false;
        }
    },

    async uploadPlaylist(playlist: Playlist): Promise<void> {
        try {
            // Fetch current playlists
            const db = await this.fetchMusicDatabase();
            const currentPlaylists = db?.playlists || [];

            // Check if already exists (by ID)
            const existingIndex = currentPlaylists.findIndex(p => p.id === playlist.id);

            let updatedPlaylists;
            if (existingIndex >= 0) {
                updatedPlaylists = [...currentPlaylists];
                updatedPlaylists[existingIndex] = playlist;
            } else {
                updatedPlaylists = [...currentPlaylists, playlist];
            }

            // Save back
            const dbRef = ref(database, 'musicas/playlists');
            await set(dbRef, updatedPlaylists);
        } catch (error) {
            console.error('Error uploading playlist:', error);
            throw error;
        }
    },

    async deleteOnlinePlaylist(playlistId: string): Promise<void> {
        try {
            const db = await this.fetchMusicDatabase();
            const currentPlaylists = db?.playlists || [];

            const updatedPlaylists = currentPlaylists.filter(p => p.id !== playlistId);

            const dbRef = ref(database, 'musicas/playlists');
            await set(dbRef, updatedPlaylists);
        } catch (error) {
            console.error('Error deleting online playlist:', error);
            throw error;
        }
    }
};
