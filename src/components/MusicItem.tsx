import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Music, FileText, Check, Download, Pencil, Trash2, Eye, EyeOff, Pin, ExternalLink, Maximize2, X, Settings } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import type { MusicMetadata, MusicLink } from '../services/drive';
import { storageService } from '../services/storage';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { PdfViewerModal } from './PdfViewerModal';
import { useApp } from '../store/AppContext';
import { useLocalUserData } from '../hooks/useLocalUserData';
import { AddItemModal } from './AddItemModal';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VisualMetronome } from './VisualMetronome';
import { PerformanceMode } from './PerformanceMode';
import { GestureSettingsModal } from './GestureSettingsModal';
import ConfirmModal from './ConfirmModal';

interface MusicItemProps {
    music: MusicMetadata;
    onAddToList?: () => void;
    onContextMenu?: (e: React.MouseEvent | React.TouchEvent, music: MusicMetadata) => void;
    isLocalPinned?: boolean;
    onToggleLocalPin?: () => void;
    forcedTransposeSteps?: number;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export const MusicItem: React.FC<MusicItemProps> = ({
    music,
    onContextMenu,
    isLocalPinned,
    forcedTransposeSteps,
    isExpanded: propIsExpanded,
    onToggleExpand
}) => {
    const { updateMusic, deleteMusic, isEditMode } = useApp();
    const { savedTranspositions, updateGlobalTransposition } = useLocalUserData();
    const [localIsExpanded, setLocalIsExpanded] = useState(false);
    const isExpanded = propIsExpanded !== undefined ? propIsExpanded : localIsExpanded;

    const [isFilesExpanded, setIsFilesExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'lyrics' | 'chords' | null>(null);
    const [localLinks, setLocalLinks] = useState<Record<string, string>>({});
    const [downloadingLinks, setDownloadingLinks] = useState<Record<string, boolean>>({});
    const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState<MusicLink | null>(null);
    const [showDeleteMediaConfirm, setShowDeleteMediaConfirm] = useState(false);
    const [transposeSteps, setTransposeStepsInternal] = useState(
        forcedTransposeSteps !== undefined ? forcedTransposeSteps : (savedTranspositions[music.id] || 0)
    );
    const [isGestureSettingsOpen, setIsGestureSettingsOpen] = useState(false);
    const [isTransposeModalOpen, setIsTransposeModalOpen] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const transposeButtonRef = useRef<HTMLButtonElement>(null);
    const touchStartTime = useRef<number>(0);
    const isLongPress = useRef<boolean>(false);

    const handleLongPress = (e: React.MouseEvent | React.TouchEvent) => {
        if (onContextMenu) {
            e.preventDefault();
            onContextMenu(e, music);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartTime.current = Date.now();
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            handleLongPress(e);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTouchMove = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            handleLongPress(e);
        }, 600);
    };

    const handleMouseUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleMouseLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const toggleExpand = () => {
        if (!isLongPress.current) {
            if (isExpanded) {
                // Collapse: Reset states
                if (onToggleExpand) {
                    onToggleExpand();
                } else {
                    setLocalIsExpanded(false);
                }
                setViewMode(null);
                setIsFilesExpanded(false);
            } else {
                if (onToggleExpand) {
                    onToggleExpand();
                } else {
                    setLocalIsExpanded(true);
                }
            }
        }
        isLongPress.current = false;
    };

    // Wrapper for setTransposeSteps that also updates global transposition
    const setTransposeSteps = (steps: number | ((prev: number) => number)) => {
        const newSteps = typeof steps === 'function' ? steps(transposeSteps) : steps;
        setTransposeStepsInternal(newSteps);
        // Only update global if not forced by playlist
        if (forcedTransposeSteps === undefined) {
            updateGlobalTransposition(music.id, newSteps);
        }
    };

    const [performanceMode, setPerformanceMode] = useState<{
        isOpen: boolean;
        content: string;
        isChordsMode: boolean;
        autoScroll: boolean;
        originalKey?: string;
    }>({
        isOpen: false,
        content: '',
        isChordsMode: false,
        autoScroll: false
    });

    const getTransposedKey = (originalKey: string, steps: number): string => {
        const keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        // Normalize input key to flat if it's sharp (just in case)
        const normalizeKey = (k: string) => {
            const map: Record<string, string> = {
                'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
            };
            return map[k] || k;
        };

        const normalizedOriginal = normalizeKey(originalKey);
        const currentIndex = keys.indexOf(normalizedOriginal);
        if (currentIndex === -1) return originalKey;
        const newIndex = (currentIndex + steps + 12) % 12;
        return keys[newIndex];
    };

    // Metronome beat handler - fade effect without zoom
    const handleBeat = () => {
        setIsPulsing(true);
        // Longer fade out for smooth effect
        setTimeout(() => setIsPulsing(false), 150);
    };



    useEffect(() => {
        const checkLocalFiles = async () => {
            const newLocalLinks: Record<string, string> = {};

            if (!music.links || music.links.length === 0) {
                setLocalLinks({});
                return;
            }

            for (const link of music.links) {
                // Check if it's already a local URI (from AddItemModal)
                if (link.url.startsWith('file://') || link.url.startsWith('content://')) {
                    newLocalLinks[link.id] = link.url;
                    continue;
                }

                // Check for downloaded files (Legacy behavior)
                const extension = link.type === 'audio' ? 'mp3' : 'pdf';
                const fileName = `${link.id}.${extension}`;
                const exists = await storageService.checkFileExists(fileName);

                if (exists) {
                    const uri = await storageService.getFileUri(fileName);
                    if (uri) {
                        newLocalLinks[link.id] = uri;
                    }
                }
            }
            setLocalLinks(newLocalLinks);
        };
        checkLocalFiles();
    }, [music.id, music.links]);

    const handleDownload = async (link: MusicLink) => {
        setDownloadingLinks(prev => ({ ...prev, [link.id]: true }));
        try {
            const response = await fetch(link.url);
            const blob = await response.blob();
            const extension = link.type === 'audio' ? 'mp3' : 'pdf';
            const fileName = `${link.id}.${extension}`;

            await storageService.saveFile(fileName, blob);
            const uri = await storageService.getFileUri(fileName);

            if (uri) {
                setLocalLinks(prev => ({ ...prev, [link.id]: uri }));
            }
        } catch (error) {
            console.error('Error downloading:', error);
            // Fallback to browser download if native fails
            const downloadUrl = link.url.replace('raw=1', 'dl=1');
            const extension = link.type === 'audio' ? 'mp3' : 'pdf';
            const fileName = `${link.label}.${extension}`;
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            setDownloadingLinks(prev => ({ ...prev, [link.id]: false }));
        }
    };

    const handleDeleteMedia = async () => {
        if (!mediaToDelete) return;

        try {
            const extension = mediaToDelete.type === 'audio' ? 'mp3' : 'pdf';
            const fileName = `${mediaToDelete.id}.${extension}`;
            await storageService.deleteFile(fileName);

            setLocalLinks(prev => {
                const newLinks = { ...prev };
                delete newLinks[mediaToDelete.id];
                return newLinks;
            });
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setShowDeleteMediaConfirm(false);
            setMediaToDelete(null);
        }
    };

    const confirmDeleteMedia = (link: MusicLink) => {
        setMediaToDelete(link);
        setShowDeleteMediaConfirm(true);
    };

    const handlePdfClick = (link: MusicLink) => {
        const url = localLinks[link.id] || link.url;
        // Convert file:// to web-accessible URL for react-pdf
        const webUrl = url.startsWith('file://') ? Capacitor.convertFileSrc(url) : url;
        setActivePdf({ url: webUrl, title: link.label });
    };

    const handleOpenFile = async (link: MusicLink) => {
        try {
            const localPath = localLinks[link.id] || (link.url.startsWith('file://') ? link.url : null);

            if (!localPath && !link.url.startsWith('http')) {
                console.error('Arquivo não encontrado localmente');
                return;
            }

            if (Capacitor.isNativePlatform()) {
                if (localPath) {
                    // Determine MIME type
                    let mimeType = '*/*';
                    if (link.type === 'pdf' || localPath.endsWith('.pdf')) mimeType = 'application/pdf';
                    else if (link.type === 'audio' || localPath.endsWith('.mp3')) mimeType = 'audio/mpeg';

                    await FileOpener.open({
                        filePath: localPath,
                        contentType: mimeType,
                        openWithDefault: true
                    });
                } else {
                    // It's a remote URL, try to open in browser
                    window.open(link.url, '_system');
                }
            } else {
                window.open(link.url, '_blank');
            }
        } catch (e) {
            console.error('Erro ao abrir arquivo:', e);
            alert('Erro ao abrir arquivo. Verifique se você tem um aplicativo compatível instalado.');
        }
    };

    const handleTogglePin = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateMusic({ ...music, pinned: !music.pinned });
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleToggleVisibility = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateMusic({ ...music, visible: !music.visible });
    };

    // Removed toggleGestureDetection as it's no longer used in this view



    const audioLinks = (music.links || []).filter(l => l.type === 'audio');
    const pdfLinks = (music.links || []).filter(l => l.type === 'pdf');
    const fileLinks = (music.links || []).filter(l => l.type === 'file');
    const hasFiles = audioLinks.length > 0 || pdfLinks.length > 0 || fileLinks.length > 0;
    const hasLyrics = !!music.lyrics;
    const hasChords = !!music.lyricsWithChords;

    // Helper for gradient styles
    const getGradientStyle = (color: string | undefined) => {
        if (!color || color === '#2a1215') return { backgroundColor: '#2a1215', borderColor: '#553E1E' };

        // If it's already a gradient string, use it directly
        if (color.startsWith('linear-gradient')) {
            return { background: color, borderImage: `${color} 1` };
        }

        // Map of legacy color IDs to their gradients
        const gradients: Record<string, { bg: string, border: string }> = {
            '#ffef43': { bg: 'linear-gradient(to right, #C89800, #C89800)', border: 'linear-gradient(to left, #C89800, #C89800)' }, // Yellow
            '#274838': { bg: 'linear-gradient(to right, #274838, #274838)', border: 'linear-gradient(to left, #274838, #274838)' }, // Green
            '#272c48': { bg: 'linear-gradient(to right, #342F4A, #342F4A)', border: 'linear-gradient(to left, #342F4A, #342F4A)' }, // Blue
            '#482727': { bg: 'linear-gradient(to right, #552311, #552311)', border: 'linear-gradient(to left, #552311, #552311)' }, // Orange
            '#274448': { bg: 'linear-gradient(to right, #164e63, #164e63)', border: 'linear-gradient(to left, #164e63, #164e63)' } // Cyan/Teal (extra)
        };

        // If legacy color ID found, convert to gradient
        if (gradients[color]) return { background: gradients[color].bg, borderImage: `${gradients[color].border} 1` };

        // Fallback for custom colors
        return { backgroundColor: color, borderColor: color };
    };

    return (
        <>
            <div
                className={`bg-[#2a1215] rounded-lg shadow-sm border overflow-hidden transition-all duration-300 select-none ${!music.visible ? 'opacity-50' : ''
                    } ${isPulsing
                        ? 'bg-[#ffef43]/20 border-[#ffef43] shadow-[0_0_30px_rgba(255,239,67,0.8)] brightness-150'
                        : (music.pinned || isLocalPinned ? 'border-[#ffef43]' : 'border-[#ffef43]/20')
                    }`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(e) => e.preventDefault()} // Prevent default browser context menu
            >
                <div
                    onClick={toggleExpand}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#361b1c]/50 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255, 239, 67, 0.2)' }}>
                            <Music className="w-4 h-4" style={{ color: '#ffef43' }} />
                        </div>
                        <div className="text-left overflow-hidden">
                            <h3
                                className="font-semibold text-white text-sm flex items-center gap-2 truncate flex-wrap"
                            >
                                {music.title}
                                {(music.pinned || isLocalPinned) && (
                                    <Pin className={`w-3 h-3 shrink-0 ${music.pinned ? 'text-[#ffef43] fill-[#ffef43]' : 'text-blue-400 fill-blue-400'}`} />
                                )}


                                {/* Key Display - Clickable for Transpose */}
                                {music.key && (
                                    <button
                                        ref={transposeButtonRef}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsTransposeModalOpen(true);
                                        }}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#361b1c] border font-bold hover:bg-[#2a1215] transition-colors"
                                        style={{
                                            color: transposeSteps === 0
                                                ? (music.key.includes('b') ? '#c89800' : '#ffef43')  // Original: yellow/orange
                                                : '#4ade80',  // Transposed: green
                                            borderColor: transposeSteps === 0
                                                ? 'rgba(255, 239, 67, 0.2)'
                                                : 'rgba(74, 222, 128, 0.3)'
                                        }}
                                        title={transposeSteps === 0
                                            ? `Tom original: ${music.key} (clique para transpor)`
                                            : `Transposto ${transposeSteps > 0 ? '+' : ''}${transposeSteps} de ${music.key}`
                                        }
                                    >
                                        {getTransposedKey(music.key, transposeSteps)}
                                    </button>
                                )}


                                {/* Metronome Display */}
                                {music.bpm && (
                                    <VisualMetronome bpm={music.bpm} onBeat={handleBeat} />
                                )}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                                {music.duration && <span className="text-[#ffef43]/70">{music.duration} • </span>}
                                {music.artist}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isEditMode && (
                            <div className="flex gap-0.5 mr-1">
                                <div
                                    onClick={(e) => handleTogglePin(e)}
                                    className={`p-1 transition-colors ${music.pinned ? 'text-[#ffef43]' : 'text-gray-400 hover:text-[#ffef43]'}`}
                                >
                                    <Pin className={`w-3 h-3 ${music.pinned ? 'fill-[#ffef43]' : ''}`} />
                                </div>
                                <div
                                    onClick={handleToggleVisibility}
                                    className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                >
                                    {music.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </div>
                                <div
                                    onClick={handleEdit}
                                    className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                >
                                    <Pencil className="w-3 h-3" />
                                </div>
                                <div
                                    onClick={handleDelete}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </div>
                            </div>
                        )}
                        {Object.keys(localLinks).length > 0 && <Check className="w-3 h-3 text-green-500" />}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className="p-3 border-t border-[#ffef43]/20 space-y-3 bg-[#361b1c]/30">
                        {/* Botões de Letra / Cifra */}
                        {(hasLyrics || hasChords) && (
                            <div className="grid grid-cols-2 gap-2">
                                {hasLyrics && (
                                    <button
                                        onClick={() => setViewMode(viewMode === 'lyrics' ? null : 'lyrics')}
                                        className={`p-2 rounded-lg text-xs font-medium transition-colors border ${viewMode === 'lyrics' ? 'bg-[#ffef43] text-[#2a1215] border-[#ffef43]' : 'bg-[#2a1215] text-gray-300 border-[#ffef43]/20 hover:border-[#ffef43]/50'}`}
                                    >
                                        Letra
                                    </button>
                                )}
                                {hasChords && (
                                    <button
                                        onClick={() => setViewMode(viewMode === 'chords' ? null : 'chords')}
                                        className={`p-2 rounded-lg text-xs font-medium transition-colors border ${viewMode === 'chords' ? 'bg-[#ffef43] text-[#2a1215] border-[#ffef43]' : 'bg-[#2a1215] text-gray-300 border-[#ffef43]/20 hover:border-[#ffef43]/50'}`}
                                    >
                                        Letra + Cifra
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Visualização da Letra/Cifra */}
                        {viewMode && (
                            <div className="relative p-3 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200 group">
                                {/* Performance Mode Buttons */}
                                <div className="absolute top-2 right-2 flex gap-2 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsGestureSettingsOpen(true);
                                        }}
                                        className="p-1.5 rounded-full transition-all shadow-lg hover:scale-110 bg-[#2a1215] text-[#00c950] border border-[#00c950]"
                                        title="Configurações de Gestos"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPerformanceMode({
                                                isOpen: true,
                                                content: viewMode === 'lyrics' ? (music.lyrics || '') : (music.lyricsWithChords || ''),
                                                isChordsMode: viewMode === 'chords',
                                                autoScroll: false,
                                                originalKey: music.key
                                            });
                                        }}
                                        className="p-1.5 rounded-full bg-[#ffef43] text-[#2a1215] shadow-lg hover:scale-110 transition-transform"
                                        title="Expandir (Modo Show)"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <MarkdownRenderer
                                    content={viewMode === 'lyrics' ? (music.lyrics || '') : (music.lyricsWithChords || '')}
                                    isChordsMode={viewMode === 'chords'}
                                    transposeSteps={transposeSteps}
                                />
                            </div>
                        )}

                        {/* Arquivos (Dropdown) */}
                        {hasFiles && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setIsFilesExpanded(!isFilesExpanded)}
                                    className="w-full flex items-center justify-center p-1 bg-[#2a1215]/50 hover:bg-[#2a1215] rounded transition-colors"
                                >
                                    {isFilesExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>

                                {isFilesExpanded && (
                                    <div className="space-y-3 pt-1">
                                        {audioLinks.length > 0 && (
                                            <div className="space-y-2">
                                                {audioLinks.map(link => (
                                                    <AudioPlayer
                                                        key={link.id}
                                                        src={localLinks[link.id] || link.url}
                                                        title={link.label}
                                                        onDownload={!localLinks[link.id] ? () => handleDownload(link) : undefined}
                                                        onDelete={localLinks[link.id] ? () => confirmDeleteMedia(link) : undefined}
                                                        isDownloaded={!!localLinks[link.id]}
                                                        isDownloading={downloadingLinks[link.id]}
                                                        bgColor={getGradientStyle(link.bgColor).background}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {pdfLinks.length > 0 && (
                                            <div className="grid gap-2">
                                                {pdfLinks.map(link => (
                                                    <div key={link.id} className="flex gap-2">
                                                        <button
                                                            onClick={() => handlePdfClick(link)}
                                                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg hover:border-[#ffef43]/50 transition-colors"
                                                            style={{ ...getGradientStyle(link.bgColor), color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                                        >
                                                            <FileText className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} />
                                                            <span className="text-xs font-medium">{link.label}</span>
                                                        </button>

                                                        {!localLinks[link.id] && (
                                                            <button
                                                                onClick={() => handleDownload(link)}
                                                                disabled={downloadingLinks[link.id]}
                                                                className="p-2 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg text-gray-500 hover:text-[#ffef43] transition-colors disabled:opacity-50"
                                                            >
                                                                {downloadingLinks[link.id] ? (
                                                                    <div className="w-4 h-4 border-2 border-[#ffef43] border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Download className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        )}

                                                        {localLinks[link.id] && (
                                                            <button
                                                                onClick={() => handleOpenFile(link)}
                                                                onTouchStart={(e) => {
                                                                    const timer = setTimeout(() => confirmDeleteMedia(link), 600);
                                                                    (e.target as any).dataset.longPressTimer = timer;
                                                                }}
                                                                onTouchEnd={(e) => {
                                                                    const timer = (e.target as any).dataset.longPressTimer;
                                                                    if (timer) clearTimeout(timer);
                                                                }}
                                                                onMouseDown={(e) => {
                                                                    const timer = setTimeout(() => confirmDeleteMedia(link), 600);
                                                                    (e.target as any).dataset.longPressTimer = timer;
                                                                }}
                                                                onMouseUp={(e) => {
                                                                    const timer = (e.target as any).dataset.longPressTimer;
                                                                    if (timer) clearTimeout(timer);
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    const timer = (e.target as any).dataset.longPressTimer;
                                                                    if (timer) clearTimeout(timer);
                                                                }}
                                                                className="p-2 bg-[#2a1215] border border-green-500/50 rounded-lg text-green-500 hover:text-green-400 hover:border-green-400 transition-colors flex items-center gap-1 relative overflow-hidden"
                                                                title="Abrir PDF (Segure para excluir)"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {fileLinks.length > 0 && (
                                            <div className="grid gap-2">
                                                {fileLinks.map(link => (
                                                    <div key={link.id} className="flex gap-2">
                                                        <button
                                                            onClick={() => handleOpenFile(link)}
                                                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg text-gray-300 hover:border-[#ffef43]/50 hover:text-[#ffef43] transition-colors"
                                                            style={{ backgroundColor: link.bgColor || '#2a1215' }}
                                                        >
                                                            {localLinks[link.id] ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                                            <span className="text-xs font-medium">{link.label}</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div >

            {/* Transpose Modal */}
            {isTransposeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={() => setIsTransposeModalOpen(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-[#2a1215] border border-[#ffef43] rounded-xl p-4 shadow-2xl w-[180px] animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[#ffef43] font-bold text-sm">Transpor</h4>
                            <button
                                onClick={() => setIsTransposeModalOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                            {['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].map((key, index) => {
                                const keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

                                // Normalize music key to ensure we find it (handle sharps if any remain)
                                const normalizeKey = (k: string) => {
                                    const map: Record<string, string> = {
                                        'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
                                    };
                                    return map[k] || k;
                                };

                                const originalKey = normalizeKey(music.key || 'C');
                                const originalIndex = keys.indexOf(originalKey);
                                const isOriginal = key === originalKey;

                                // Calculate steps: Target Index - Original Index
                                let steps = index - (originalIndex === -1 ? 0 : originalIndex);

                                // Normalize steps to be within -6 to +6 range for cleaner transposition
                                if (steps > 6) steps -= 12;
                                if (steps < -6) steps += 12;

                                const isSelected = transposeSteps === steps;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setTransposeSteps(steps);
                                            setIsTransposeModalOpen(false);
                                        }}
                                        className={`p-2 rounded-lg font-bold text-sm transition-all ${isOriginal
                                            ? 'bg-[#ffef43] text-[#2a1215] border-2 border-[#ffef43] shadow-[0_0_10px_rgba(255,239,67,0.4)]'
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
                        <button
                            onClick={() => setIsTransposeModalOpen(false)}
                            className="w-full py-2 bg-[#361b1c] text-gray-300 rounded-lg hover:bg-[#2a1215] hover:text-white transition-colors text-sm"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            <PdfViewerModal
                isOpen={!!activePdf}
                onClose={() => setActivePdf(null)}
                pdfUrl={activePdf?.url || ''}
            />

            <AddItemModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                type="music"
                initialData={music}
            />

            <PerformanceMode
                isOpen={performanceMode.isOpen}
                onClose={() => setPerformanceMode(prev => ({ ...prev, isOpen: false }))}
                content={performanceMode.content}
                isChordsMode={performanceMode.isChordsMode}
                title={music.title}
                artist={music.artist}
                transposeSteps={transposeSteps}
                onTransposeChange={setTransposeSteps}
            />

            <GestureSettingsModal
                isOpen={isGestureSettingsOpen}
                onClose={() => setIsGestureSettingsOpen(false)}
            />

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    deleteMusic(music.id);
                    setShowDeleteConfirm(false);
                }}
                title="Excluir Música"
                message={`Tem certeza que deseja excluir "${music.title}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                isDestructive={true}
            />

            <ConfirmModal
                isOpen={showDeleteMediaConfirm}
                onClose={() => setShowDeleteMediaConfirm(false)}
                onConfirm={handleDeleteMedia}
                title="Excluir Arquivo"
                message={`Tem certeza que deseja excluir o arquivo "${mediaToDelete?.label}"?`}
                confirmText="Excluir"
                isDestructive={true}
            />
        </>
    );
};
