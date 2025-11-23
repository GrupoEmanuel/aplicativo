import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Music, FileText, Check, Download, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Pin, ExternalLink, Maximize2, PlayCircle } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import type { MusicMetadata, MusicLink } from '../services/drive';
import { storageService } from '../services/storage';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { PdfViewerModal } from './PdfViewerModal';
import { useApp } from '../store/AppContext';
import { AddItemModal } from './AddItemModal';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VisualMetronome } from './VisualMetronome';
import { PerformanceMode } from './PerformanceMode';

interface MusicItemProps {
    music: MusicMetadata;
}

export const MusicItem: React.FC<MusicItemProps> = ({ music }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFilesExpanded, setIsFilesExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'lyrics' | 'chords' | null>(null);
    const [localLinks, setLocalLinks] = useState<Record<string, string>>({});
    const [downloadingLinks, setDownloadingLinks] = useState<Record<string, boolean>>({});
    const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [performanceMode, setPerformanceMode] = useState<{
        isOpen: boolean;
        content: string;
        isChordsMode: boolean;
        autoScroll: boolean;
    }>({
        isOpen: false,
        content: '',
        isChordsMode: false,
        autoScroll: false
    });
    const { isEditMode, updateMusic, deleteMusic, moveMusic, musicList } = useApp();

    // Metronome beat handler
    const handleBeat = () => {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 100);
    };

    useEffect(() => {
        const checkLocalFiles = async () => {
            const newLocalLinks: Record<string, string> = {};

            if (!music.links || music.links.length === 0) {
                setLocalLinks({});
                return;
            }

            for (const link of music.links) {
                const extension = link.type === 'audio' ? 'mp3' : 'pdf';
                const fileName = `${link.id}.${extension}`;
                const exists = await storageService.checkFileExists(fileName);

                if (exists) {
                    try {
                        const fileUri = await Filesystem.getUri({
                            path: fileName,
                            directory: Directory.Data
                        });
                        newLocalLinks[link.id] = fileUri.uri;
                    } catch (e) {
                        console.error(`Error getting URI for ${fileName}:`, e);
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
            const savedUri = await storageService.saveFile(fileName, blob);
            setLocalLinks(prev => ({ ...prev, [link.id]: savedUri }));
        } catch (error) {
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

    const handlePdfClick = (link: MusicLink) => {
        const url = localLinks[link.id] || link.url;
        setActivePdf({ url, title: link.label });
    };

    const handleOpenPdf = async (link: MusicLink) => {
        try {
            const localPath = localLinks[link.id];
            if (!localPath) {
                console.error('PDF não encontrado localmente');
                return;
            }

            if (Capacitor.isNativePlatform()) {
                const extension = 'pdf';
                const fileName = `${link.id}.${extension}`;

                const fileUri = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Data
                });

                await FileOpener.open({
                    filePath: fileUri.uri,
                    contentType: 'application/pdf',
                    openWithDefault: true
                });
            } else {
                window.open(link.url, '_blank');
            }
        } catch (error) {
            console.error('Erro ao abrir PDF:', error);
            alert('Erro ao abrir PDF. Tente baixar novamente.');
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta música?')) {
            await deleteMusic(music.id);
        }
    };

    const handleToggleVisibility = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateMusic({ ...music, visible: !music.visible });
    };

    const handleTogglePin = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateMusic({ ...music, pinned: !music.pinned });
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditModalOpen(true);
    };

    const audioLinks = (music.links || []).filter(l => l.type === 'audio');
    const pdfLinks = (music.links || []).filter(l => l.type === 'pdf');
    const hasFiles = audioLinks.length > 0 || pdfLinks.length > 0;
    const hasLyrics = !!music.lyrics;
    const hasChords = !!music.lyricsWithChords;

    return (
        <>
            <div
                className={`bg-[#2a1215] rounded-lg shadow-sm border overflow-hidden transition-all duration-75 ${!music.visible ? 'opacity-50' : ''
                    } ${isPulsing
                        ? 'border-[#ffef43] shadow-[0_0_15px_rgba(255,239,67,0.3)] bg-[#361b1c] scale-[1.02]'
                        : (music.pinned ? 'border-[#ffef43]' : 'border-[#ffef43]/20')
                    }`}
            >
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#361b1c]/50 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255, 239, 67, 0.2)' }}>
                            <Music className="w-4 h-4" style={{ color: '#ffef43' }} />
                        </div>
                        <div className="text-left overflow-hidden">
                            <h3 className="font-semibold text-white text-sm flex items-center gap-2 truncate flex-wrap">
                                {music.title}
                                {music.pinned && <Pin className="w-3 h-3 text-[#ffef43] fill-[#ffef43] shrink-0" />}

                                {/* Key Display */}
                                {music.key && (
                                    <span
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#361b1c] border border-[#ffef43]/20 font-bold"
                                        style={{ color: music.key.includes('#') ? '#c89800' : '#ffef43' }}
                                    >
                                        {music.key}
                                    </span>
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        moveMusic(music.id, 'up');
                                    }}
                                    className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                    style={{ opacity: musicList[0]?.id === music.id ? 0.3 : 1, pointerEvents: musicList[0]?.id === music.id ? 'none' : 'auto' }}
                                >
                                    <ArrowUp className="w-3 h-3" />
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        moveMusic(music.id, 'down');
                                    }}
                                    className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                    style={{ opacity: musicList[musicList.length - 1]?.id === music.id ? 0.3 : 1, pointerEvents: musicList[musicList.length - 1]?.id === music.id ? 'none' : 'auto' }}
                                >
                                    <ArrowDown className="w-3 h-3" />
                                </div>
                                <div
                                    onClick={handleTogglePin}
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
                                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPerformanceMode({
                                                isOpen: true,
                                                content: viewMode === 'lyrics' ? (music.lyrics || '') : (music.lyricsWithChords || ''),
                                                isChordsMode: viewMode === 'chords',
                                                autoScroll: false
                                            });
                                        }}
                                        className="p-2 bg-[#ffef43] text-[#2a1215] rounded-full shadow-lg hover:scale-110 transition-transform"
                                        title="Expandir (Modo Show)"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPerformanceMode({
                                                isOpen: true,
                                                content: viewMode === 'lyrics' ? (music.lyrics || '') : (music.lyricsWithChords || ''),
                                                isChordsMode: viewMode === 'chords',
                                                autoScroll: true
                                            });
                                        }}
                                        className="p-2 bg-[#2a1215] text-[#ffef43] border border-[#ffef43] rounded-full shadow-lg hover:scale-110 transition-transform"
                                        title="Rolar Texto (Salvação)"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                    </button>
                                </div>

                                <MarkdownRenderer
                                    content={viewMode === 'lyrics' ? (music.lyrics || '') : (music.lyricsWithChords || '')}
                                    isChordsMode={viewMode === 'chords'}
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
                                                        isDownloaded={!!localLinks[link.id]}
                                                        isDownloading={downloadingLinks[link.id]}
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
                                                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg text-gray-300 hover:border-[#ffef43]/50 hover:text-[#ffef43] transition-colors"
                                                        >
                                                            <FileText className="w-4 h-4" />
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
                                                                onClick={() => handleOpenPdf(link)}
                                                                className="p-2 bg-[#2a1215] border border-green-500/50 rounded-lg text-green-500 hover:text-green-400 hover:border-green-400 transition-colors flex items-center gap-1"
                                                                title="Abrir PDF"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </button>
                                                        )}
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
                initialAutoScroll={performanceMode.autoScroll}
            />
        </>
    );
};
