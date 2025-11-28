import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export const storageService = {
    async saveFile(path: string, data: string | Blob): Promise<string> {
        try {
            // Ensure directory exists (this might need recursive creation logic in a real app)
            // For now, we assume flat structure or existing dirs

            if (data instanceof Blob) {
                // Convert Blob to base64
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const base64 = reader.result as string;
                        // Remove data URL prefix if present (e.g., "data:audio/mp3;base64,")
                        resolve(base64.split(',')[1]);
                    };
                    reader.onerror = reject;
                });
                reader.readAsDataURL(data);
                const base64Data = await base64Promise;

                await Filesystem.writeFile({
                    path,
                    data: base64Data,
                    directory: Directory.Data,
                });
            } else {
                await Filesystem.writeFile({
                    path,
                    data,
                    directory: Directory.Data,
                    encoding: Encoding.UTF8,
                });
            }

            const uri = await Filesystem.getUri({
                path,
                directory: Directory.Data,
            });
            return uri.uri;
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    },

    async getFileUri(path: string): Promise<string | null> {
        try {
            const uri = await Filesystem.getUri({
                path,
                directory: Directory.Data,
            });
            return uri.uri;
        } catch (error) {
            console.error('Error getting file URI:', error);
            return null;
        }
    },

    async downloadFile(url: string, path: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            return await this.saveFile(path, blob);
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    },

    async readFile(path: string): Promise<string | Blob> {
        try {
            const result = await Filesystem.readFile({
                path,
                directory: Directory.Data,
                // encoding: Encoding.UTF8, // Don't specify encoding to get base64 for binary
            });
            return result.data;
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    },

    async checkFileExists(path: string): Promise<boolean> {
        try {
            await Filesystem.stat({
                path,
                directory: Directory.Data,
            });
            return true;
        } catch {
            return false;
        }
    },

    async deleteFile(path: string): Promise<void> {
        try {
            await Filesystem.deleteFile({
                path,
                directory: Directory.Data,
            });
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    },

    async setPreference(key: string, value: string) {
        await Preferences.set({ key, value });
    },

    async getPreference(key: string): Promise<string | null> {
        const { value } = await Preferences.get({ key });
        return value;
    },

    async set(key: string, value: any): Promise<void> {
        await Preferences.set({
            key,
            value: JSON.stringify(value)
        });
    },

    async get<T>(key: string): Promise<T | null> {
        const { value } = await Preferences.get({ key });
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch (e) {
            console.error('Error parsing stored value:', e);
            return null;
        }
    }
};
