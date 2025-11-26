import React, { useRef, useState } from 'react';
import { Play, Pause, Download, Loader2, RotateCcw, RotateCw } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
    title: string;
    onDownload?: () => void;
    isDownloaded?: boolean;
    isDownloading?: boolean;
    bgColor?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, onDownload, isDownloaded, isDownloading, bgColor }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            setCurrentTime(current);
            setDuration(dur);
            setProgress((current / dur) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newProgress = parseFloat(e.target.value);
        setProgress(newProgress);
        if (audioRef.current && duration) {
            audioRef.current.currentTime = (newProgress / 100) * duration;
        }
    };

    const skipForward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
        }
    };

    const skipBackward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="rounded-lg p-2 border transition-colors" style={{ backgroundColor: bgColor || '#2a1215', borderColor: 'rgba(255, 239, 67, 0.2)' }}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider truncate max-w-[70%]" style={{ color: '#ffef43' }}>{title}</span>
                {onDownload && (
                    <button
                        onClick={onDownload}
                        disabled={isDownloaded || isDownloading}
                        className={`p-1 rounded-full transition-colors`}
                        style={isDownloaded
                            ? { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                            : { color: '#9ca3af' }
                        }
                    >
                        {isDownloading ? (
                            <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#ffef43' }} />
                        ) : (
                            <Download className="w-3 h-3" />
                        )}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={skipBackward}
                    className="p-1.5 text-gray-400 hover:text-[#ffef43] transition-colors"
                    title="-10s"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>

                <button
                    onClick={togglePlay}
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors shadow-sm shrink-0"
                    style={{ backgroundColor: '#ffef43', color: '#2a1215' }}
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <button
                    onClick={skipForward}
                    className="p-1.5 text-gray-400 hover:text-[#ffef43] transition-colors"
                    title="+10s"
                >
                    <RotateCw className="w-4 h-4" />
                </button>

                <div className="flex-1 flex flex-col justify-center gap-0.5">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress || 0}
                        onChange={handleSeek}
                        className="w-full h-1 bg-[#361b1c] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffef43]"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={handleTimeUpdate}
            />
        </div>
    );
};
