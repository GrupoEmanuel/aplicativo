import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Loader2, RotateCcw, RotateCw, X } from 'lucide-react';
import { useAudio } from '../store/AudioContext';

interface AudioPlayerProps {
    src: string;
    title: string;
    onDownload?: () => void;
    onDelete?: () => void;
    isDownloaded?: boolean;
    isDownloading?: boolean;
    bgColor?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, onDownload, onDelete, isDownloaded, isDownloading, bgColor }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Generate a unique ID for this player instance if one isn't provided
    // In a real app, you might pass a unique ID prop
    const [playerId] = useState(() => Math.random().toString(36).substr(2, 9));

    const { currentAudioId, play, pause } = useAudio();
    const isPlaying = currentAudioId === playerId;

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Error playing audio:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const togglePlay = () => {
        if (isPlaying) {
            pause(playerId);
        } else {
            play(playerId);
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
        <div className="rounded-lg p-2 border transition-colors" style={{ background: bgColor || '#2a1215', borderColor: 'rgba(255, 239, 67, 0.2)' }}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider truncate max-w-[70%]" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{title}</span>
                {isDownloaded ? (
                    <button
                        onClick={onDelete}
                        className="p-1 rounded-full transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Excluir download"
                    >
                        <X className="w-3 h-3" />
                    </button>
                ) : (
                    onDownload && (
                        <button
                            onClick={onDownload}
                            disabled={isDownloading}
                            className={`p-1 rounded-full transition-colors text-gray-400 hover:text-[#ffef43]`}
                        >
                            {isDownloading ? (
                                <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#ffef43' }} />
                            ) : (
                                <Download className="w-3 h-3" />
                            )}
                        </button>
                    )
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={skipBackward}
                    className="p-1.5 text-white hover:text-[#ffef43] transition-colors"
                    style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}
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
                    className="p-1.5 text-white hover:text-[#ffef43] transition-colors"
                    style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}
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
                    <div className="flex justify-between text-[9px] font-mono" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => pause(playerId)}
                onLoadedMetadata={handleTimeUpdate}
            />
        </div>
    );
};
