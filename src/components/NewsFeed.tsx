import React, { useState } from 'react';
import { Newspaper, MapPin, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Pin } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { AddItemModal } from './AddItemModal';
import { MarkdownRenderer } from './MarkdownRenderer';

export const NewsFeed: React.FC = () => {
    const { newsList, locationsList, isEditMode, deleteNews, updateNews, moveNews, deleteLocation, updateLocation, moveLocation } = useApp();
    const [activeTab, setActiveTab] = useState<'news' | 'locations'>('news');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingItem(null);
    };

    const handleTogglePinNews = async (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        await updateNews({ ...item, pinned: !item.pinned });
    };

    const handleTogglePinLocation = async (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        await updateLocation({ ...item, pinned: !item.pinned });
    };

    return (
        <>
            <div className="rounded-xl shadow-sm p-4 mb-3" style={{ backgroundColor: '#2a1215' }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Newspaper className="w-5 h-5" style={{ color: '#ffef43' }} />
                        <h2 className="text-lg font-semibold" style={{ color: '#ffef43' }}>
                            Mural
                        </h2>
                    </div>
                    <div className="flex rounded-lg p-1" style={{ backgroundColor: '#361b1c' }}>
                        <button
                            onClick={() => setActiveTab('news')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all`}
                            style={activeTab === 'news'
                                ? { backgroundColor: '#c89800', color: 'white' }
                                : { color: '#9ca3af' }
                            }
                        >
                            Avisos
                        </button>
                        <button
                            onClick={() => setActiveTab('locations')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all`}
                            style={activeTab === 'locations'
                                ? { backgroundColor: '#c89800', color: 'white' }
                                : { color: '#9ca3af' }
                            }
                        >
                            Locais
                        </button>
                    </div>
                </div>

                {isEditMode && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full py-3 mb-3 border-2 border-dashed border-[#ffef43]/30 rounded-xl text-[#ffef43]/70 hover:border-[#ffef43] hover:text-[#ffef43] hover:bg-[#ffef43]/5 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar {activeTab === 'news' ? 'Aviso' : 'Local'}
                    </button>
                )}

                <div className="space-y-2">
                    {activeTab === 'news' ? (
                        newsList.map((news) => (
                            <div
                                key={news.id}
                                className={`rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${!news.visible ? 'opacity-50' : ''}`}
                                style={{
                                    backgroundColor: 'rgba(54, 27, 28, 0.5)',
                                    borderColor: news.pinned ? '#ffef43' : 'rgba(255, 239, 67, 0.2)'
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {news.title}
                                            {news.pinned && <Pin className="w-4 h-4 text-[#ffef43] fill-[#ffef43]" />}
                                        </h3>
                                        <span className="text-sm text-[#ffef43]/80">{news.date}</span>
                                    </div>
                                    {isEditMode && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => moveNews(news.id, 'up')}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                style={{ opacity: newsList[0]?.id === news.id ? 0.3 : 1, pointerEvents: newsList[0]?.id === news.id ? 'none' : 'auto' }}
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => moveNews(news.id, 'down')}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                style={{ opacity: newsList[newsList.length - 1]?.id === news.id ? 0.3 : 1, pointerEvents: newsList[newsList.length - 1]?.id === news.id ? 'none' : 'auto' }}
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleTogglePinNews(news, e)}
                                                className={`p-1 transition-colors ${news.pinned ? 'text-[#ffef43]' : 'text-gray-400 hover:text-[#ffef43]'}`}
                                            >
                                                <Pin className={`w-4 h-4 ${news.pinned ? 'fill-[#ffef43]' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => updateNews({ ...news, visible: !news.visible })}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                            >
                                                {news.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(news)}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Excluir este aviso?')) deleteNews(news.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-gray-300 leading-relaxed">
                                    <MarkdownRenderer content={news.content} />
                                </div>
                            </div>
                        ))
                    ) : (
                        locationsList.map((location) => (
                            <div
                                key={location.id}
                                className={`rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${!location.visible ? 'opacity-50' : ''}`}
                                style={{
                                    backgroundColor: 'rgba(54, 27, 28, 0.5)',
                                    borderColor: location.pinned ? '#ffef43' : 'rgba(255, 239, 67, 0.2)'
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {location.name}
                                            {location.pinned && <Pin className="w-4 h-4 text-[#ffef43] fill-[#ffef43]" />}
                                        </h3>
                                        <p className="text-gray-300 mt-1">{location.address}</p>
                                    </div>
                                    {isEditMode && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => moveLocation(location.id, 'up')}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                style={{ opacity: locationsList[0]?.id === location.id ? 0.3 : 1, pointerEvents: locationsList[0]?.id === location.id ? 'none' : 'auto' }}
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => moveLocation(location.id, 'down')}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                                style={{ opacity: locationsList[locationsList.length - 1]?.id === location.id ? 0.3 : 1, pointerEvents: locationsList[locationsList.length - 1]?.id === location.id ? 'none' : 'auto' }}
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleTogglePinLocation(location, e)}
                                                className={`p-1 transition-colors ${location.pinned ? 'text-[#ffef43]' : 'text-gray-400 hover:text-[#ffef43]'}`}
                                            >
                                                <Pin className={`w-4 h-4 ${location.pinned ? 'fill-[#ffef43]' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => updateLocation({ ...location, visible: !location.visible })}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                            >
                                                {location.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(location)}
                                                className="p-1 text-gray-400 hover:text-[#ffef43] transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Excluir este local?')) deleteLocation(location.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <a
                                    href={location.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#ffef43] hover:text-[#c89800] transition-colors mt-2"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Ver no Google Maps
                                </a>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AddItemModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                type={activeTab === 'news' ? 'news' : 'location'}
                initialData={editingItem}
            />
        </>
    );
};
