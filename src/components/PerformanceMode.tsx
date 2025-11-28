import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Play, Pause, Scan } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useWakeLock } from '../hooks/useWakeLock';
import { gestureDetectionService, type DebugInfo } from '../services/gestureDetection';

interface PerformanceModeProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    isChordsMode: boolean;
    title: string;
    artist: string;
    initialAutoScroll?: boolean;
    transposeSteps?: number;
    onTransposeChange?: (steps: number) => void;
    originalKey?: string;
}

const FONT_SIZES = [
    'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'
];

export const PerformanceMode: React.FC<PerformanceModeProps> = ({
    isOpen,
    onClose,
    content,
    isChordsMode,
    title,
    artist,
    initialAutoScroll = false,
    transposeSteps = 0,
    onTransposeChange,
    originalKey = 'C'
}) => {
    const [isScrolling, setIsScrolling] = useState(initialAutoScroll);
    const [scrollSpeed] = useState(1);
    // Default to text-xl for lyrics, text-base for chords (slightly smaller than before)
    const [fontSizeIndex, setFontSizeIndex] = useState(isChordsMode ? 1 : 3);
    const [isGestureEnabled, setIsGestureEnabled] = useState(false);
    const [isTransposeModalOpen, setIsTransposeModalOpen] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [config, setConfig] = useState(gestureDetectionService.getConfig());
    const [showDebug, setShowDebug] = useState(false);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInteracting = useRef(false);
    const justSkippedCountdown = useRef(false);
    const gestureButtonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

                // Start service if enabled
                if (enabled) {
                    await gestureDetectionService.start();
                }
            };
            loadGestureState();
        } else {
            // Stop gesture detection when closing
            gestureDetectionService.stop();
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
            justSkippedCountdown.current = true; // Prevent onClick from triggering scroll
            // Reset flag after delay
            setTimeout(() => {
                justSkippedCountdown.current = false;
            }, 800);
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
            setDebugInfo(null);
        } else {
            await gestureDetectionService.start();
            setIsGestureEnabled(true);

            // Listen for gesture events
            gestureDetectionService.onGesture((event) => {
                if (event.type === config.toggleScroll) {
                    handleToggleScroll();
                }
            });

            // Listen for debug events
            gestureDetectionService.onDebug((info) => {
                setDebugInfo(info);
            });
        }
    };

    const handleGestureButtonDown = () => {
        gestureButtonTimer.current = setTimeout(() => {
            setShowDebug(prev => !prev);
        }, 1000); // 1 second long press
    };

    const handleGestureButtonUp = () => {
        if (gestureButtonTimer.current) {
            clearTimeout(gestureButtonTimer.current);
            gestureButtonTimer.current = null;
        }
    };

    const switchCamera = async () => {
        const newFacing = config.cameraFacing === 'user' ? 'environment' : 'user';
        const newConfig = { ...config, cameraFacing: newFacing as 'user' | 'environment' };
        await gestureDetectionService.saveConfig(newConfig);
        setConfig(newConfig);

        // Restart service to apply new camera
        if (isGestureEnabled) {
            gestureDetectionService.stop();
            setTimeout(async () => {
                await gestureDetectionService.start();

                // Re-attach listeners
                gestureDetectionService.onGesture((event) => {
                    if (event.type === config.toggleScroll) {
                        handleToggleScroll();
                    }
                });
                gestureDetectionService.onDebug((info) => {
                    setDebugInfo(info);
                });
            }, 500);
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
                    {/* Transpose Controls */}
                    {onTransposeChange && (
                        <div className="relative">
                            <button
                                onClick={() => setIsTransposeModalOpen(!isTransposeModalOpen)}
                                className="text-[10px] px-2 py-1 rounded bg-[#361b1c] border font-bold hover:bg-[#2a1215] transition-colors flex items-center gap-1"
                                style={{
                                    color: transposeSteps === 0
                                        ? (originalKey?.includes('b') ? '#c89800' : '#ffef43')
                                        : '#4ade80',
                                    borderColor: transposeSteps === 0
                                        ? (originalKey?.includes('b') ? 'rgba(200, 152, 0, 0.3)' : 'rgba(255, 239, 67, 0.5)')
                                        : 'rgba(74, 222, 128, 0.5)'
                                }}
                            >
                                {transposeSteps === 0 ? (originalKey || 'Original') : `${transposeSteps > 0 ? '+' : ''}${transposeSteps}`}
                            </button>

                            {/* Transpose Modal */}
                            {isTransposeModalOpen && (
                                <>
                                    <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm" onClick={() => setIsTransposeModalOpen(false)} />
                                    <div className="absolute top-full right-0 mt-2 z-[120] bg-[#2a1215] border border-[#ffef43] rounded-xl p-4 shadow-2xl w-[180px] animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[#ffef43] font-bold text-sm">Transpor</h4>
                                            <button
                                                onClick={() => setIsTransposeModalOpen(false)}
                                                className="text-gray-400 hover:text-white"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-1.5">
                                            {['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].map((key, index) => {
                                                const keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

                                                // Normalize music key
                                                const normalizeKey = (k: string) => {
                                                    const map: Record<string, string> = {
                                                        'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
                                                    };
                                                    return map[k] || k;
                                                };

                                                const normOriginalKey = normalizeKey(originalKey || 'C');
                                                const originalIndex = keys.indexOf(normOriginalKey);
                                                const isOriginal = key === normOriginalKey;

                                                // Calculate steps
                                                let steps = index - (originalIndex === -1 ? 0 : originalIndex);
                                                if (steps > 6) steps -= 12;
                                                if (steps < -6) steps += 12;

                                                const isSelected = transposeSteps === steps;

                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => {
                                                            onTransposeChange(steps);
                                                            setIsTransposeModalOpen(false);
                                                        }}
                                                        className={`p-2 rounded-lg font-bold text-sm transition-all ${isOriginal
                                                            ? 'bg-[#ffef43] text-[#2a1215] border-2 border-[#ffef43]'
                                                            : isSelected
                                                                ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                                                                : 'bg-[#361b1c] text-gray-300 border border-[#ffef43]/20 hover:border-[#ffef43]/50 hover:text-[#ffef43]'
                                                            }`}
                                                        style={{
                                                            color: isOriginal
                                                                ? '#2a1215'
                                                                : key.includes('b') && !isSelected
                                                                    ? '#c89800'
                                                                    : undefined
                                                        }}
                                                    >
                                                        {key}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-[#361b1c] rounded-lg p-0 border border-[#ffef43]/50">
                        <button
                            onClick={() => adjustFontSize(-1)}
                            className="px-2 py-1 hover:bg-[#2a1215] rounded text-[#ffef43] transition-colors"
                            disabled={fontSizeIndex === 0}
                        >
                            <span className="w-2 h-2">-</span>
                        </button>
                        <span className="w-2 text-center text-xs font-bold text-[#ffef43]">{fontSizeIndex + 1}</span>
                        <button
                            onClick={() => adjustFontSize(1)}
                            className="px-2 py-1 hover:bg-[#2a1215] rounded text-[#ffef43] transition-colors"
                            disabled={fontSizeIndex === FONT_SIZES.length - 1}
                        >
                            <span className="w-2 h-2">+</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Control Buttons - Below Header, Upper Right */}
            <div className="fixed top-16 right-4 z-30 flex flex-col gap-2">
                <button
                    onClick={handleToggleScroll}
                    className={`p-1 rounded-full transition-all transform hover:scale-105 ${isScrolling
                        ? 'bg-[#ffef43] text-[#361b1c] border border-[#ffef43] shadow-[0_0_20px_rgba(255,239,67,0.4)]'
                        : 'bg-[#361b1c] text-[#ffef43] border border-[#ffef43]/60'
                        }`}
                >
                    {isScrolling ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <button
                    onClick={toggleGestureDetection}
                    onMouseDown={handleGestureButtonDown}
                    onMouseUp={handleGestureButtonUp}
                    onTouchStart={handleGestureButtonDown}
                    onTouchEnd={handleGestureButtonUp}
                    className={`p-1 rounded-full transition-all ${isGestureEnabled
                        ? 'bg-green-500 text-[#361b1c] border border-[#00c950] shadow-[0_0_15px_rgba(0,79,31,0.5)]'
                        : 'bg-[#361b1c] text-[#00c950] border border-[#00c950]/60'
                        }`}
                    title="Ativar/Desativar Controle por Gesto (Segure para Debug)"
                >
                    <Scan className="w-5 h-5" />
                </button>
            </div>

            {/* Debug Overlay */}
            {showDebug && isGestureEnabled && debugInfo && (
                <div className="fixed top-32 right-4 z-40 bg-black/80 p-2 rounded text-[10px] text-green-400 font-mono border border-green-500/50 w-32">
                    <div className="flex justify-between items-center mb-1 border-b border-green-500/30 pb-1">
                        <span className="font-bold">DEBUG</span>
                        <button onClick={switchCamera} className="bg-green-900 px-1 rounded hover:bg-green-800">
                            {config.cameraFacing === 'user' ? 'Front' : 'Back'}
                        </button>
                    </div>
                    <div>Faces: {debugInfo.facesDetected}</div>
                    <div>X: {debugInfo.eulerX.toFixed(1)}</div>
                    <div>Y: {debugInfo.eulerY.toFixed(1)}</div>
                    <div>R Eye: {debugInfo.rightEyeOpen.toFixed(2)}</div>
                    <div>L Eye: {debugInfo.leftEyeOpen.toFixed(2)}</div>
                </div>
            )}

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
                        return; // CRITICAL: Exit handler to prevent half-screen scroll on this same click
                    }

                    // Only allow half-screen scroll if scrolling is active AND countdown was not just skipped
                    if (isScrolling && !justSkippedCountdown.current) {
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
            {
                isGestureEnabled && (
                    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
                        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-white/70">Gestos Ativos</span>
                            <Scan className="w-3 h-3 text-white/50" />
                        </div>
                    </div>
                )
            }
        </div >,
        document.body
    );
};
