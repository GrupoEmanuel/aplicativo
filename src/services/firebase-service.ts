import { ref, get, set, remove } from "firebase/database";
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
    transpositions?: Record<string, number>;
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
                const data = snapshot.val();

                // Handle playlists being an object (map) or array
                let playlists: Playlist[] = [];
                if (data.playlists) {
                    if (Array.isArray(data.playlists)) {
                        playlists = data.playlists.filter(Boolean); // Filter nulls if any
                    } else {
                        playlists = Object.values(data.playlists);
                    }
                }

                const musicDb: MusicDatabase = {
                    ...data,
                    playlists
                };

                console.log('✅ Firebase data loaded. Version:', musicDb.lastUpdated);
                console.log('📊 Music count:', musicDb.music?.length, 'Playlists count:', musicDb.playlists?.length);
                return musicDb;
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
            // Use atomic update on specific path to avoid race conditions
            const playlistRef = ref(database, `musicas/playlists/${playlist.id}`);
            await set(playlistRef, playlist);
            console.log(`✅ Playlist ${playlist.name} uploaded successfully.`);
        } catch (error) {
            console.error('Error uploading playlist:', error);
            throw error;
        }
    },

    async deleteOnlinePlaylist(playlistId: string): Promise<void> {
        try {
            // Use atomic remove on specific path
            const playlistRef = ref(database, `musicas/playlists/${playlistId}`);
            await remove(playlistRef);
            console.log(`✅ Playlist ${playlistId} deleted successfully.`);
        } catch (error) {
            console.error('Error deleting online playlist:', error);
            throw error;
        }
    }
};
