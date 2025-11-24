import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Play, Pause, Plus, Minus } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useWakeLock } from '../hooks/useWakeLock';

interface PerformanceModeProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    isChordsMode: boolean;
    title: string;
    artist: string;
    initialAutoScroll?: boolean;
    transposeSteps?: number;
}

const FONT_SIZES = [
    'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'
];

export const PerformanceMode: React.FC<PerformanceModeProps> = ({
    isOpen,
    onClose,
    content,
    isChordsMode,
    title,
    artist,
    initialAutoScroll = false,
    transposeSteps = 0
}) => {
    const [isScrolling, setIsScrolling] = useState(initialAutoScroll);
    const [scrollSpeed, setScrollSpeed] = useState(1);
    // Default to text-xl for lyrics, text-base for chords (slightly smaller than before)
    const [fontSizeIndex, setFontSizeIndex] = useState(isChordsMode ? 1 : 3);
    const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInteracting = useRef(false);

    // Keep screen awake while in performance mode
    useWakeLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsScrolling(initialAutoScroll);
            // Reset font size when opening new song? Or keep preference? 
            // Let's reset to sensible defaults for now based on mode
            setFontSizeIndex(isChordsMode ? 1 : 3);
        }
    }, [isOpen, initialAutoScroll, isChordsMode]);

    useEffect(() => {
        if (isScrolling) {
            // Slower speed: 100ms interval instead of 50ms
            scrollIntervalRef.current = setInterval(() => {
                if (containerRef.current && !isInteracting.current) {
                    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                    // Stop scrolling if near the bottom
                    if (scrollTop + clientHeight >= scrollHeight - 50) { // 50px buffer
                        setIsScrolling(false);
                        return;
                    }
                    containerRef.current.scrollTop += scrollSpeed;
                }
            }, 100);
        } else {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, [isScrolling, scrollSpeed]);

    const handleEmergencyScroll = (e: React.MouseEvent) => {
        // Only trigger if clicking the container background or text, not buttons
        if (containerRef.current) {
            containerRef.current.scrollBy({
                top: window.innerHeight / 2,
                behavior: 'smooth'
            });
        }
    };

    const handleInteractionStart = () => {
        isInteracting.current = true;
    };

    const handleInteractionEnd = () => {
        // Small delay to prevent jumpiness
        setTimeout(() => {
            isInteracting.current = false;
        }, 500);
    };

    const adjustFontSize = (delta: number) => {
        setFontSizeIndex(prev => {
            const newIndex = prev + delta;
            return Math.max(0, Math.min(newIndex, FONT_SIZES.length - 1));
        });
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#1a0b0d] flex flex-col">
            {/* Controls Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-[#1a0b0d] via-[#1a0b0d]/80 to-transparent pointer-events-none">
                <div className="pointer-events-auto">
                    <h2 className="text-[#ffef43] text-xl font-bold leading-tight">{title}</h2>
                    <p className="text-gray-400 text-sm">{artist}</p>
                </div>
                <div className="flex gap-2 pointer-events-auto items-center">
                    {/* Font Size Controls */}
                    <div className="flex items-center gap-1 bg-[#2a1215] rounded-full border border-white/10 mr-2">
                        <button
                            onClick={() => adjustFontSize(-1)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            disabled={fontSizeIndex === 0}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-gray-500 w-4 text-center">
                            {fontSizeIndex + 1}
                        </span>
                        <button
                            onClick={() => adjustFontSize(1)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            disabled={fontSizeIndex === FONT_SIZES.length - 1}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsScrolling(!isScrolling)}
                        className={`p-1.5 rounded-full transition-all ${isScrolling
                            ? 'bg-[#ffef43] text-[#2a1215] shadow-[0_0_15px_#ffef43]'
                            : 'bg-[#2a1215] text-[#ffef43] border border-[#ffef43]/30'
                            }`}
                    >
                        {isScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-[#2a1215] text-gray-400 border border-white/10 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div
                ref={containerRef}
                onClick={handleEmergencyScroll}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                className="flex-1 overflow-y-auto px-4 pt-24 pb-12 scroll-smooth cursor-pointer"
            >
                <div className="max-w-4xl mx-auto min-h-full">
                    <MarkdownRenderer
                        content={content}
                        isChordsMode={isChordsMode}
                        fontSize={FONT_SIZES[fontSizeIndex]}
                        transposeSteps={transposeSteps}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};
