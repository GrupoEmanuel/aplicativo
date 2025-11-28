import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioContextType {
    currentAudioId: string | null;
    play: (id: string) => void;
    pause: (id: string) => void;
    stopAll: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);

    const play = useCallback((id: string) => {
        setCurrentAudioId(id);
    }, []);

    const pause = useCallback((id: string) => {
        if (currentAudioId === id) {
            setCurrentAudioId(null);
        }
    }, [currentAudioId]);

    const stopAll = useCallback(() => {
        setCurrentAudioId(null);
    }, []);

    return (
        <AudioContext.Provider value={{ currentAudioId, play, pause, stopAll }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
