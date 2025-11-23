import { firebaseService, type GeneralDatabase, type MusicDatabase } from './firebase-service';

export interface DriveConfig {
    agendaUrl: string;
    newsUrl: string;
    musicConfigUrl: string;
}

export interface MusicLink {
    id: string;
    type: 'audio' | 'pdf';
    label: string;
    url: string;
}

export interface MusicMetadata {
    id: string;
    title: string;
    artist: string;
    links: MusicLink[];
    lyrics?: string; // Markdown formatted lyrics (clean)
    lyricsWithChords?: string; // Markdown formatted lyrics with chords
    key?: string; // Musical key (Tom)
    bpm?: number; // Beats per minute (Tempo)
    duration?: string; // Song duration in format "MM:SS" (e.g., "4:15")
    visible: boolean;
    pinned?: boolean;
}

export interface NewsItem {
    id: string;
    title: string;
    content: string;
    date: string; // ISO Date string YYYY-MM-DD
    visible: boolean;
    pinned?: boolean;
}

export interface AgendaItem {
    id: string;
    title: string;
    date: string; // ISO Date string YYYY-MM-DD
    time: string;
    location: string;
    type: 'ensaios' | 'escalas';
    description?: string;
    visible: boolean;
    pinned?: boolean;
}

export interface LocationItem {
    id: string;
    name: string;
    address: string;
    mapsUrl: string;
    visible: boolean;
    pinned?: boolean;
}

// Mock configuration for now - in production this would fetch from a known Drive URL
const MOCK_CONFIG: DriveConfig = {
    agendaUrl: 'https://docs.google.com/document/d/MOCK_AGENDA/export?format=txt',
    newsUrl: 'https://docs.google.com/document/d/MOCK_NEWS/export?format=txt',
    musicConfigUrl: 'https://drive.google.com/uc?id=MOCK_MUSIC_JSON',
};

export const driveService = {
    async fetchConfig(): Promise<DriveConfig> {
        // In the future, this might fetch a master config file from a fixed URL
        return MOCK_CONFIG;
    },

    async fetchTextContent(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch content');
            return await response.text();
        } catch (error) {
            console.error('Error fetching text content:', error);
            return '';
        }
    },

    async fetchMusicDatabase(): Promise<MusicDatabase | null> {
        // Fetch from Firebase
        return await firebaseService.fetchMusicDatabase();
    },

    async fetchGeneralDatabase(): Promise<GeneralDatabase | null> {
        // Fetch from Firebase
        return await firebaseService.fetchGeneralDatabase();
    },

    // Deprecated: Use fetchMusicDatabase instead
    async fetchMusicMetadata(): Promise<MusicMetadata[]> {
        const db = await this.fetchMusicDatabase();
        return db ? db.music : [];
    },

    // Deprecated: Use fetchGeneralDatabase instead
    async fetchNews(): Promise<NewsItem[]> {
        const db = await this.fetchGeneralDatabase();
        return db ? db.news : [];
    },

    // Deprecated: Use fetchGeneralDatabase instead
    async fetchAgenda(): Promise<AgendaItem[]> {
        const db = await this.fetchGeneralDatabase();
        return db ? db.agenda : [];
    },

    async addMusic(music: Omit<MusicMetadata, 'id'>): Promise<MusicMetadata> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { ...music, id: Date.now().toString() };
    },

    async addNews(news: Omit<NewsItem, 'id'>): Promise<NewsItem> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { ...news, id: Date.now().toString() };
    },

    async addAgenda(agenda: Omit<AgendaItem, 'id'>): Promise<AgendaItem> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { ...agenda, id: Date.now().toString() };
    }
};
