import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Play, Pause, Plus, Minus, Scan } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useWakeLock } from '../hooks/useWakeLock';
import { gestureDetectionService } from '../services/gestureDetection';

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
    const [scrollSpeed] = useState(1);
    // Default to text-xl for lyrics, text-base for chords (slightly smaller than before)
    const [fontSizeIndex, setFontSizeIndex] = useState(isChordsMode ? 1 : 3);
    const [isGestureEnabled, setIsGestureEnabled] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [config, setConfig] = useState(gestureDetectionService.getConfig());
    const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInteracting = useRef(false);
    const justSkippedCountdown = useRef(false);

    // Keep screen awake while in performance mode
    useWakeLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsScrolling(initialAutoScroll);
            // Reset font size when opening new song? Or keep preference? 
            // Let's reset to sensible defaults for now based on mode
            setFontSizeIndex(isChordsMode ? 1 : 3);

            // Load current gesture state and config
            const loadGestureState = async () => {
                const enabled = await gestureDetectionService.getEnabled();
                setIsGestureEnabled(enabled);
                await gestureDetectionService.loadConfig();
                setConfig(gestureDetectionService.getConfig());
            };
            loadGestureState();
        } else {
            // Don't stop gesture detection when closing - it should persist
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

    // Countdown Timer
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c! - 1), 1000);
        } else if (countdown === 0) {
            setCountdown(null);
            setIsScrolling(true);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    const handleToggleScroll = () => {
        if (isScrolling) {
            setIsScrolling(false);
            setCountdown(null);
        } else {
            // If there's a countdown configured and we're not currently scrolling
            if (config.scrollCountdown > 0) {
                setCountdown(config.scrollCountdown);
            } else {
                setIsScrolling(true);
            }
        }
    };

    const handleInteractionStart = () => {
        isInteracting.current = true;
        // If user interacts during countdown, skip it and start scrolling immediately
        if (countdown !== null) {
            setCountdown(null);
            setIsScrolling(true);
        }
    };

    const handleInteractionEnd = () => {
        isInteracting.current = false;
    };

    const adjustFontSize = (delta: number) => {
        setFontSizeIndex(prev => {
            const newIndex = prev + delta;
            return Math.max(0, Math.min(newIndex, FONT_SIZES.length - 1));
        });
    };

    const toggleGestureDetection = async () => {
        if (isGestureEnabled) {
            gestureDetectionService.stop();
            setIsGestureEnabled(false);
        } else {
            await gestureDetectionService.start();
            setIsGestureEnabled(true);

            // Listen for gesture events
            gestureDetectionService.onGesture((event) => {
                if (event.type === config.toggleScroll) {
                    handleToggleScroll();
                }
            });
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] bg-[#2a1215] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-[#ffef43]/20 bg-[#2a1215] z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[#361b1c] text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4.5 h-4.5" />
                    </button>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">{title}</h2>
                        <p className="text-[#ffef43] text-sm">{artist}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-[#361b1c] rounded-lg p-1 border border-[#ffef43]/20">
                        <button
                            onClick={() => adjustFontSize(-1)}
                            className="p-2 hover:bg-[#2a1215] rounded text-[#ffef43] transition-colors"
                            disabled={fontSizeIndex === 0}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-3 text-center text-xs text-gray-400">Aa</span>
                        <button
                            onClick={() => adjustFontSize(1)}
                            className="p-2 hover:bg-[#2a1215] rounded text-[#ffef43] transition-colors"
                            disabled={fontSizeIndex === FONT_SIZES.length - 1}
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    <button
                        onClick={handleToggleScroll}
                        className={`p-1 rounded-full transition-all transform hover:scale-105 ${isScrolling
                            ? 'bg-[#ffef43] text-[#2a1215] shadow-[0_0_20px_rgba(255,239,67,0.4)]'
                            : 'bg-[#361b1c] text-[#ffef43] border border-[#ffef43]/30'
                            }`}
                    >
                        {isScrolling ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current" />}
                    </button>

                    <button
                        onClick={toggleGestureDetection}
                        className={`p-1 rounded-full transition-all ${isGestureEnabled
                            ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                            : 'bg-[#361b1c] text-gray-400 border border-[#ffef43]/30'
                            }`}
                        title="Ativar/Desativar Controle por Gesto"
                    >
                        <Scan className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* Countdown Timer - Positioned outside header */}
            {countdown !== null && (
                <div className="absolute top-14 right-4 z-20">
                    <div className="flex items-center gap-2 bg-[#ffef43]/20 px-3 py-1.5 rounded-full animate-pulse border border-[#ffef43]/50 shadow-lg">
                        <span className="text-[#ffef43] font-bold font-mono text-lg">{countdown}s</span>
                        <span className="text-[#ffef43]/70 text-xs uppercase tracking-wider">Iniciando...</span>
                    </div>
                </div>
            )}

            {/* Content */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 scroll-smooth relative"
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onClick={() => {
                    if (countdown !== null) {
                        // Skip countdown on click
                        setCountdown(null);
                        setIsScrolling(true);
                        justSkippedCountdown.current = true;
                        // Reset flag after delay to prevent accidental scroll after countdown skip
                        setTimeout(() => {
                            justSkippedCountdown.current = false;
                        }, 800); // Longer delay to give user time to see countdown disappeared
                    } else if (isScrolling && !justSkippedCountdown.current) {
                        // Advance half screen when auto-scrolling (helps guitar players)
                        if (containerRef.current) {
                            // Temporarily pause auto-scroll to allow manual scroll
                            isInteracting.current = true;
                            const halfScreen = containerRef.current.clientHeight / 2;
                            containerRef.current.scrollBy({ top: halfScreen, behavior: 'smooth' });
                            // Resume auto-scroll after smooth scroll completes (~600ms for smooth scroll)
                            setTimeout(() => {
                                isInteracting.current = false;
                            }, 600);
                        }
                    }
                }}
            >
                <div className="max-w-4xl mx-auto pb-[50vh]">
                    <MarkdownRenderer
                        content={content}
                        isChordsMode={isChordsMode}
                        fontSize={FONT_SIZES[fontSizeIndex]}
                        transposeSteps={transposeSteps}
                    />
                </div>
            </div>

            {/* Gesture Indicator */}
            {isGestureEnabled && (
                <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-white/70">Gestos Ativos</span>
                        <Scan className="w-3 h-3 text-white/50" />
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
