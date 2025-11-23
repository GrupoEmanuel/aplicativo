/**
 * Converts sharing links from various platforms to direct/raw format
 * Supports: Dropbox, Google Drive, GitHub
 */
export const convertToRawUrl = (url: string): string => {
    if (!url) return url;

    // Dropbox: Use raw=1 for direct access (works for both download and inline viewing)
    if (url.includes('dropbox.com')) {
        // Remove dl=0 or dl=1 if present
        let cleanUrl = url.replace(/[&?]dl=[01]/, '');

        // If already has raw=1, return as is
        if (cleanUrl.includes('raw=1')) {
            return cleanUrl;
        }

        // Add raw=1
        const separator = cleanUrl.includes('?') ? '&' : '?';
        return `${cleanUrl}${separator}raw=1`;
    }

    // Google Drive: Convert to direct download link
    if (url.includes('drive.google.com')) {
        // Extract file ID from various Google Drive URL formats
        let fileId = null;

        // Format: https://drive.google.com/file/d/FILE_ID/view
        const match1 = url.match(/\/file\/d\/([^\/]+)/);
        if (match1) {
            fileId = match1[1];
        }

        // Format: https://drive.google.com/open?id=FILE_ID
        const match2 = url.match(/[?&]id=([^&]+)/);
        if (match2) {
            fileId = match2[1];
        }

        if (fileId) {
            // Use uc?export=download for direct download
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
    }

    // GitHub: Convert to raw.githubusercontent.com
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
        // Format: https://github.com/user/repo/blob/branch/path
        return url
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('/blob/', '/');
    }

    // Return original URL if no conversion needed
    return url;
};
