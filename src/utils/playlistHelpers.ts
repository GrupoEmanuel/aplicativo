// Helper function to calculate playlist total duration with seconds
export const calculatePlaylistDuration = (songs: any[]) => {
    if (!songs.length) return '0:00';

    let totalSeconds = 0;
    songs.forEach((song: any) => {
        if (song?.duration) {
            const [min, sec] = song.duration.split(':').map(Number);
            totalSeconds += (min * 60) + sec;
        }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

// Helper to calculate duration for a single playlist by ID
export const getPlaylistTotalDuration = (musicList: any[], musicIds: string[]) => {
    const playlistSongs = musicIds
        .map(id => musicList.find(m => m.id === id))
        .filter(Boolean);

    return calculatePlaylistDuration(playlistSongs);
};
