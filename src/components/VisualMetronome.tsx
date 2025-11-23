import React, { useState, useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

interface VisualMetronomeProps {
    bpm: number;
    onBeat?: () => void;
}

export const VisualMetronome: React.FC<VisualMetronomeProps> = ({ bpm, onBeat }) => {
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const toggleMetronome = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsActive(!isActive);
    };

    useEffect(() => {
        if (isActive && bpm > 0) {
            const intervalMs = (60 / bpm) * 1000;

            intervalRef.current = setInterval(() => {
                if (onBeat) onBeat();
            }, intervalMs);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, bpm, onBeat]);

    return (
        <button
            onClick={toggleMetronome}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all duration-200 ${isActive
                    ? 'bg-[#ffef43] border-[#ffef43] text-[#2a1215]'
                    : 'bg-[#361b1c] border-[#ffef43]/20 text-[#ffef43] hover:border-[#ffef43]/50'
                }`}
            title={isActive ? "Parar Metrônomo" : "Iniciar Metrônomo Visual"}
        >
            <Activity className={`w-3 h-3 ${isActive ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold min-w-[2ch] text-center">
                {bpm}
            </span>
        </button>
    );
};
