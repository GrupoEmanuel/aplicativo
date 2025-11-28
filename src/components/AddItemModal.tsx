import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Loader2, Trash2, Save, ArrowUp, ArrowDown, Palette, Calendar, ChevronDown } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { CalendarPicker } from './CalendarPicker';
import { storageService } from '../services/storage';
import type { MusicLink } from '../services/drive';
import { convertToRawUrl } from '../utils/linkConverter';

type ItemType = 'news' | 'agenda' | 'music' | 'location';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: ItemType;
    initialData?: any;
    defaultAgendaType?: 'ensaios' | 'escalas';
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, type, initialData, defaultAgendaType = 'ensaios' }) => {
    const { addNews, updateNews, addAgenda, updateAgenda, addMusic, updateMusic, addLocation, updateLocation } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [agendaType, setAgendaType] = useState<'ensaios' | 'escalas'>('ensaios');
    const [artist, setArtist] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [lyricsWithChords, setLyricsWithChords] = useState('');
    const [key, setKey] = useState('');
    const [bpm, setBpm] = useState<number | ''>('');
    const [duration, setDuration] = useState('');
    const [tapTimes, setTapTimes] = useState<number[]>([]);

    // Location specific states
    const [address, setAddress] = useState('');
    const [mapsUrl, setMapsUrl] = useState('');

    // Dynamic Links State
    const [links, setLinks] = useState<Omit<MusicLink, 'id'>[]>([]);
    const [newLinkType, setNewLinkType] = useState<'audio' | 'pdf' | 'file'>('audio');
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
    const [isKeyOpen, setIsKeyOpen] = useState(false);
    const [isBpmOpen, setIsBpmOpen] = useState(false);

    // Date/Time Helpers
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '30'];

    // Parsed Date/Time states for selects
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedHour, setSelectedHour] = useState('');
    const [selectedMinute, setSelectedMinute] = useState('00');

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || initialData.name || '');
            setContent(initialData.content || initialData.description || '');
            setDate(initialData.date || '');
            setTime(initialData.time || '');
            setLocation(initialData.location || '');
            setAgendaType(initialData.type || 'ensaios');
            setArtist(initialData.artist || '');
            setLyrics(initialData.lyrics || '');
            setLyricsWithChords(initialData.lyricsWithChords || '');
            setKey(initialData.key || '');
            setBpm(initialData.bpm || '');
            setDuration(initialData.duration || '');
            setAddress(initialData.address || '');
            setMapsUrl(initialData.mapsUrl || '');


            if (initialData.time) {
                const [h, min] = initialData.time.split(':');
                setSelectedHour(h);
                setSelectedMinute(min);
            }

            if (initialData.links) {
                setLinks(initialData.links.map((l: MusicLink) => ({
                    type: l.type,
                    label: l.label,
                    url: l.url,
                    bgColor: l.bgColor
                })));
            }
        } else if (isOpen && !initialData) {
            // Reset form when opening for new item
            setTitle('');
            setContent('');
            setDate('');
            setTime('');
            setLocation('');
            setAgendaType(defaultAgendaType); // Use prop default
            setArtist('');
            setLyrics('');
            setLyricsWithChords('');
            setKey('');
            setKey('');
            setBpm('');
            setAddress('');
            setMapsUrl('');
            setLinks([]);

            // Reset custom selects
            if (type === 'agenda') {
                setSelectedHour('19');
                setSelectedMinute('30');
            } else {
                setSelectedHour('');
                setSelectedMinute('00');
            }
        }
    }, [isOpen, initialData, defaultAgendaType]);

    // Update main time state when selects change
    useEffect(() => {
        if (selectedHour && selectedMinute) {
            setTime(`${selectedHour}:${selectedMinute}`);
        }
    }, [selectedHour, selectedMinute]);

    const handleDateChange = (newDate: Date) => {
        const y = newDate.getFullYear();
        const m = (newDate.getMonth() + 1).toString().padStart(2, '0');
        const d = newDate.getDate().toString().padStart(2, '0');
        setDate(`${y}-${m}-${d}`);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y.slice(2)}`;
    };

    if (!isOpen) return null;

    const getTitle = () => {
        const action = initialData ? 'Editar' : 'Adicionar';
        switch (type) {
            case 'news': return `${action} Notícia`;
            case 'agenda': return `${action} Agenda`;
            case 'music': return `${action} Música`;
            case 'location': return `${action} Local`;
        }
    };

    const handleAddLink = () => {
        if (newLinkLabel && newLinkUrl) {
            // Auto-convert to raw/direct URL
            const rawUrl = convertToRawUrl(newLinkUrl);
            setLinks([...links, { type: newLinkType, label: newLinkLabel, url: rawUrl, bgColor: '#2a1215' }]);
            setNewLinkLabel('');
            setNewLinkUrl('');
        }
    };

    const handleRemoveLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newLinks = [...links];
        [newLinks[index - 1], newLinks[index]] = [newLinks[index], newLinks[index - 1]];
        setLinks(newLinks);
    };

    const handleMoveDown = (index: number) => {
        if (index === links.length - 1) return;
        const newLinks = [...links];
        [newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]];
        setLinks(newLinks);
    };

    const handleSetLinkColor = (index: number, color: string) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], bgColor: color };
        setLinks(newLinks);
        setColorPickerIndex(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (type === 'news') {
                if (initialData) {
                    await updateNews({ ...initialData, title, content, date });
                } else {
                    await addNews({ title, content, date, visible: true });
                }
            } else if (type === 'agenda') {
                if (initialData) {
                    await updateAgenda({ ...initialData, title, date, time, location, type: agendaType, description: content });
                } else {
                    await addAgenda({ title, date, time, location, type: agendaType, description: content, visible: true });
                }
            } else if (type === 'music') {
                const musicLinks: MusicLink[] = links.map((link, index) => ({
                    ...link,
                    bgColor: link.bgColor || '#2a1215', // Ensure bgColor is never undefined
                    id: initialData?.links?.[index]?.id || `link-${Date.now()}-${index}`
                }));

                if (initialData) {
                    await updateMusic({
                        ...initialData,
                        title,
                        artist,
                        links: musicLinks,
                        lyrics: lyrics || undefined,
                        lyricsWithChords: lyricsWithChords || undefined,
                        key: key || undefined,
                        bpm: bpm || undefined,
                        duration: duration || undefined
                    });
                } else {
                    await addMusic({
                        title,
                        artist,
                        links: musicLinks,
                        lyrics: lyrics || undefined,
                        lyricsWithChords: lyricsWithChords || undefined,
                        key: key || undefined,
                        bpm: bpm || undefined,
                        duration: duration || undefined,
                        visible: true
                    });
                }
            } else if (type === 'location') {
                if (initialData) {
                    await updateLocation({ ...initialData, name: title, address, mapsUrl });
                } else {
                    await addLocation({ name: title, address, mapsUrl, visible: true });
                }
            }
            onClose();
        } catch (error) {
            alert('Erro ao salvar item. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm">
            <div className={`bg-[#2a1215] rounded-2xl shadow-xl w-full ${type === 'music' ? 'max-w-4xl' : 'max-w-md'} overflow-hidden transition-all duration-200 max-h-[90vh] overflow-y-auto border border-[#ffef43]/20`}>
                <div className="p-2 border-b border-[#ffef43]/10 flex flex-wrap justify-between items-center gap-3 sticky top-0 bg-[#2a1215] z-10">
                    <h2 className="text-lg font-bold text-[#ffef43] flex items-center gap-2">
                        {initialData ? <Save className="w-5 h-5 text-[#ffef43]" /> : <Plus className="w-5 h-5 text-[#ffef43]" />}
                        {getTitle()}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#361b1c] rounded-full transition-colors text-[#ffef43]/70 hover:text-[#ffef43]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-3 space-y-2">
                    {/* Common Title Field (Hidden for Music to allow custom layout) */}
                    {type !== 'music' && (
                        <div>
                            <label className="block text-xs font-medium text-[#ffef43]/80 mb-0.5">
                                {type === 'location' ? 'Nome do Local' : 'Título'}
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-1.5 rounded border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30 text-sm"
                                placeholder={type === 'location' ? "Ex: Igreja Sede" : "Digite o título..."}
                            />
                        </div>
                    )}

                    {/* News Fields */}
                    {type === 'news' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                    Conteúdo
                                </label>
                                <textarea
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30"
                                    placeholder="Digite a notícia..."
                                />
                            </div>
                        </>
                    )}

                    {/* Agenda Fields */}
                    {type === 'agenda' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-[#ffef43]/80 mb-0.5">
                                        Data
                                    </label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className="flex items-center justify-between w-full px-3 py-1.5 rounded border border-[#ffef43]/30 bg-[#361b1c] text-white cursor-pointer hover:border-[#ffef43] transition-colors"
                                        >
                                            <span className="text-sm">{formatDateDisplay(date) || 'DD/MM/YY'}</span>
                                            <Calendar className="w-4 h-4 text-[#ffef43]" />
                                        </div>
                                        {showCalendar && (
                                            <CalendarPicker
                                                selectedDate={date ? new Date(date + 'T12:00:00') : null}
                                                onChange={handleDateChange}
                                                onClose={() => setShowCalendar(false)}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#ffef43]/80 mb-0.5">
                                        Horário
                                    </label>
                                    <div className="flex gap-1">
                                        <select
                                            value={selectedHour}
                                            onChange={(e) => setSelectedHour(e.target.value)}
                                            className="flex-1 px-1 py-1.5 rounded border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] outline-none transition-colors text-xs"
                                        >
                                            {hours.map(h => <option key={h} value={h}>{h}h</option>)}
                                        </select>
                                        <select
                                            value={selectedMinute}
                                            onChange={(e) => setSelectedMinute(e.target.value)}
                                            className="flex-1 px-1 py-1.5 rounded border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] outline-none transition-colors text-xs"
                                        >
                                            {minutes.map(m => <option key={m} value={m}>{m}min</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#ffef43]/80 mb-0.5">
                                    Tipo
                                </label>
                                <select
                                    value={agendaType}
                                    onChange={(e) => setAgendaType(e.target.value as any)}
                                    className="w-full px-3 py-1.5 rounded border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors text-sm"
                                >
                                    <option value="escalas">Escala/Compromisso</option>
                                    <option value="ensaios">Ensaio</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#ffef43]/80 mb-0.5">
                                    Local
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30 text-sm"
                                    placeholder="Ex: Igreja Sede"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#ffef43]/80 mb-0.5">
                                    Descrição (Opcional)
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-1.5 rounded border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30 text-sm"
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>
                        </>
                    )}

                    {/* Location Fields */}
                    {type === 'location' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                    Endereço
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30"
                                    placeholder="Rua, Número, Bairro..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                    Link do Google Maps
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={mapsUrl}
                                    onChange={(e) => setMapsUrl(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30"
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>
                        </>
                    )}

                    {/* Music Fields */}
                    {type === 'music' && (
                        <>
                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-12 md:col-span-5">
                                    <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                        Título
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30"
                                        placeholder="Digite o título..."
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                        Artista/Grupo
                                    </label>
                                    <input
                                        type="text"
                                        value={artist}
                                        onChange={(e) => setArtist(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30"
                                        placeholder="Ex: Grupo Emanuel"
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                        Tom
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsKeyOpen(!isKeyOpen);
                                                setIsBpmOpen(false);
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors flex items-center justify-between"
                                            style={{ color: key.includes('b') ? '#c89800' : '#ffef43' }}
                                        >
                                            {key || '...'}
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </button>
                                        {isKeyOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a1215] border border-[#ffef43]/30 rounded-lg shadow-xl z-[60] max-h-60 overflow-y-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setKey('');
                                                        setIsKeyOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-[#ffef43]/10 text-gray-400 border-b border-[#ffef43]/10"
                                                >
                                                    ...
                                                </button>
                                                {['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                                                    <button
                                                        key={k}
                                                        type="button"
                                                        onClick={() => {
                                                            setKey(k);
                                                            setIsKeyOpen(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-[#ffef43]/10"
                                                        style={{ color: k.includes('b') ? '#c89800' : '#ffef43' }}
                                                    >
                                                        {k}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-5 md:col-span-2">
                                    <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                        BPM
                                    </label>
                                    <div className="flex gap-1 relative">
                                        <div className="relative w-full">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsBpmOpen(!isBpmOpen);
                                                    setIsKeyOpen(false);
                                                }}
                                                className="w-full px-2 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors text-sm flex items-center justify-between"
                                            >
                                                {bpm || '...'}
                                                <ChevronDown className="w-3 h-3 opacity-50" />
                                            </button>
                                            {isBpmOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a1215] border border-[#ffef43]/30 rounded-lg shadow-xl z-[60] max-h-60 overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setBpm(0);
                                                            setIsBpmOpen(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-[#ffef43]/10 text-gray-400 border-b border-[#ffef43]/10"
                                                    >
                                                        ...
                                                    </button>
                                                    {Array.from({ length: 149 }, (_, i) => i + 32).map(num => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => {
                                                                setBpm(num);
                                                                setIsBpmOpen(false);
                                                            }}
                                                            className="w-full px-4 py-2 text-left hover:bg-[#ffef43]/10 text-[#ffef43]"
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = Date.now();
                                                const newTaps = [...tapTimes, now].filter(t => now - t < 2000);

                                                if (newTaps.length > 1) {
                                                    const intervals = [];
                                                    for (let i = 1; i < newTaps.length; i++) {
                                                        intervals.push(newTaps[i] - newTaps[i - 1]);
                                                    }
                                                    const avg = intervals.reduce((a, b) => a + b) / intervals.length;
                                                    const newBpm = Math.round(60000 / avg);
                                                    if (newBpm >= 32 && newBpm <= 180) setBpm(newBpm);
                                                }
                                                setTapTimes(newTaps);
                                            }}
                                            className="px-4 py-2 bg-[#ffef43]/10 border border-[#ffef43]/30 rounded-lg text-[#ffef43] hover:bg-[#ffef43]/20 active:scale-95 transition-all"
                                            title="Toque no ritmo para descobrir o BPM"
                                        >
                                            ?
                                        </button>
                                    </div>
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                        Duração
                                    </label>
                                    <input
                                        type="text"
                                        value={duration}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-digits
                                            if (value.length >= 3) {
                                                // Auto-format: insert colon before last 2 digits
                                                value = value.slice(0, -2) + ':' + value.slice(-2);
                                            }
                                            setDuration(value);
                                        }}
                                        className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors placeholder-white/30 text-sm"
                                        placeholder="4:15"
                                        maxLength={5}
                                    />
                                </div>
                            </div>

                            {/* Lyrics Field */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                <div>
                                    <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                        Letra (Sem Cifra)
                                    </label>
                                    <textarea
                                        value={lyrics}
                                        onChange={(e) => setLyrics(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors font-mono text-sm placeholder-white/30"
                                        placeholder="Digite a letra limpa..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#ffef43]/80 mb-1">
                                        Letra com Cifra
                                    </label>
                                    <textarea
                                        value={lyricsWithChords}
                                        onChange={(e) => setLyricsWithChords(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-2 rounded-lg border border-[#ffef43]/30 bg-[#361b1c] text-white focus:border-[#ffef43] focus:ring-1 focus:ring-[#ffef43] outline-none transition-colors font-mono text-sm placeholder-white/30"
                                        placeholder="Digite a letra com cifras..."
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-[#ffef43]/60 mt-1">
                                Formatação: <code className="bg-[#361b1c] px-1 rounded border border-[#ffef43]/20">*negrito*</code>, <code className="bg-[#361b1c] px-1 rounded border border-[#ffef43]/20">_itálico_</code>, <code className="bg-[#361b1c] px-1 rounded border border-[#ffef43]/20">[Verso]</code>, <code className="bg-[#361b1c] px-1 rounded border border-[#ffef43]/20">&#123;Cantor&#125;</code>
                            </p>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-[#ffef43]/80">
                                    Links (Áudio/PDF)
                                </label>

                                {/* List of added links */}
                                {links.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {links.map((link, index) => (
                                            <div key={index} className="relative">
                                                <div
                                                    className="flex items-center justify-between p-2 rounded-lg border border-[#ffef43]/20"
                                                    style={{ background: link.bgColor || '#361b1c' }}
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${link.type === 'audio' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' : link.type === 'pdf' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'bg-orange-900/30 text-orange-400 border border-orange-500/30'}`}>
                                                            {link.type === 'audio' ? 'MP3' : link.type === 'pdf' ? 'PDF' : 'FILE'}
                                                        </span>
                                                        <span className="text-sm text-white truncate">
                                                            {link.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setColorPickerIndex(index)}
                                                            className="p-1 text-[#ffef43]/50 hover:text-[#ffef43] transition-colors rounded-full hover:bg-[#ffef43]/10"
                                                            title="Escolher cor"
                                                        >
                                                            <Palette className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveUp(index)}
                                                            disabled={index === 0}
                                                            className="p-1 text-[#ffef43]/50 hover:text-[#ffef43] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover para cima"
                                                        >
                                                            <ArrowUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveDown(index)}
                                                            disabled={index === links.length - 1}
                                                            className="p-1 text-[#ffef43]/50 hover:text-[#ffef43] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover para baixo"
                                                        >
                                                            <ArrowDown className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveLink(index)}
                                                            className="p-1 text-[#ffef43]/50 hover:text-red-500 transition-colors"
                                                            title="Remover"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Color Picker Modal */}
                                                {colorPickerIndex === index && (
                                                    <div className="absolute z-50 mt-1 right-0 bg-[#2a1215] border border-[#ffef43]/20 rounded-lg p-2 shadow-xl">
                                                        <p className="text-xs text-[#ffef43] mb-2 font-medium">Escolher Cor:</p>
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {[
                                                                { color: '#2a1215', label: 'Padrão' },
                                                                { color: 'linear-gradient(to left, #2A1215, #3B1913)', label: 'Amarelo' },
                                                                { color: 'linear-gradient(to left, #2A1215, #5A3A0F)', label: 'Verde' },
                                                                { color: 'linear-gradient(to left, #2A1215, #2E1E2A)', label: 'Azul' },
                                                                { color: 'linear-gradient(to left, #2A1215, #292823)', label: 'Laranja' }
                                                            ].map(({ color, label }) => (
                                                                <button
                                                                    key={color}
                                                                    type="button"
                                                                    onClick={() => handleSetLinkColor(index, color)}
                                                                    className="w-8 h-8 rounded-full border-2 border-[#ffef43]/30 hover:border-[#ffef43] transition-colors"
                                                                    style={{ background: color }}
                                                                    title={label}
                                                                />
                                                            ))}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setColorPickerIndex(null)}
                                                            className="w-full mt-2 text-xs text-gray-400 hover:text-white"
                                                        >
                                                            Fechar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add new link form */}
                                <div className="p-3 bg-[#361b1c] rounded-lg border border-[#ffef43]/20 space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <select
                                            value={newLinkType}
                                            onChange={(e) => setNewLinkType(e.target.value as 'audio' | 'pdf' | 'file')}
                                            className="col-span-1 px-2 py-1.5 text-sm rounded border border-[#ffef43]/30 bg-[#2a1215] text-white outline-none focus:border-[#ffef43]"
                                        >
                                            <option value="audio">Áudio</option>
                                            <option value="pdf">PDF</option>
                                            <option value="file">Arquivo</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={newLinkLabel}
                                            onChange={(e) => setNewLinkLabel(e.target.value)}
                                            placeholder="Ex: Voz 1"
                                            className="col-span-2 px-2 py-1.5 text-sm rounded border border-[#ffef43]/30 bg-[#2a1215] text-white outline-none focus:border-[#ffef43] placeholder-white/30"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    try {
                                                        // Save file to app storage
                                                        const savedUri = await storageService.saveFile(file.name, file);
                                                        setNewLinkUrl(savedUri);
                                                        if (!newLinkLabel) {
                                                            setNewLinkLabel(file.name);
                                                        }
                                                        // Auto-detect type
                                                        if (file.type.includes('pdf')) {
                                                            setNewLinkType('pdf');
                                                        } else if (file.type.includes('audio')) {
                                                            setNewLinkType('audio');
                                                        } else {
                                                            setNewLinkType('file');
                                                        }
                                                    } catch (error) {
                                                        console.error('Error saving file:', error);
                                                        alert('Erro ao salvar arquivo. Tente novamente.');
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="flex-1 flex gap-1">
                                            <input
                                                type="url"
                                                value={newLinkUrl}
                                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                                placeholder={newLinkType === 'file' || newLinkType === 'pdf' ? "URL ou Escolha um arquivo..." : "https://..."}
                                                className="flex-1 px-2 py-1.5 text-sm rounded border border-[#ffef43]/30 bg-[#2a1215] text-white outline-none focus:border-[#ffef43] placeholder-white/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                                className="px-3 py-1.5 bg-[#ffef43]/10 text-[#ffef43] rounded hover:bg-[#ffef43]/20 transition-colors border border-[#ffef43]/30 whitespace-nowrap text-xs"
                                            >
                                                Arquivo
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddLink}
                                            disabled={!newLinkLabel || !newLinkUrl}
                                            className="px-3 py-1.5 bg-[#ffef43]/20 text-[#ffef43] rounded hover:bg-[#ffef43]/30 disabled:opacity-50 transition-colors border border-[#ffef43]/30"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                    }

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#ffef43] hover:bg-[#c89800] text-[#2a1215] font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            initialData ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />
                        )}
                        {initialData ? 'Salvar Alterações' : 'Adicionar'}
                    </button>
                </form >
            </div >
        </div >,
        document.body
    );
};


