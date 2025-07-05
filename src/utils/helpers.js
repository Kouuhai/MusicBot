export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

export function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&\S*)?$/;
    return youtubeRegex.test(url);
}

export function sanitizeSearchQuery(query) {
    // Bersihkan query dari karakter yang tidak diinginkan
    return query.replace(/[^\w\s-_.]/gi, '').trim();
}

export function getErrorMessage(error) {
    if (error.message.includes('Video unavailable')) {
        return 'Video tidak tersedia atau telah dihapus';
    } else if (error.message.includes('Private video')) {
        return 'Video bersifat privat dan tidak dapat diputar';
    } else if (error.message.includes('Age-restricted')) {
        return 'Video memiliki batasan usia';
    } else {
        return 'Terjadi kesalahan tidak terduga';
    }
}