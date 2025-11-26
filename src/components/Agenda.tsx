import React, { useState } from 'react';
import { Calendar, Users, Briefcase, Plus, Pencil, Trash2, Eye, EyeOff, Pin } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { AddItemModal } from './AddItemModal';
import type { AgendaItem } from '../services/drive';

interface AgendaProps {
    onAdd: (type: 'ensaios' | 'escalas') => void;
}

export const Agenda: React.FC<AgendaProps> = ({ onAdd }) => {
    const { agendaList, isEditMode, updateAgenda, deleteAgenda } = useApp();
    const [activeTab, setActiveTab] = useState<'ensaios' | 'escalas'>('escalas');
    const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este evento?')) {
            await deleteAgenda(id);
        }
    };

    const handleToggleVisibility = async (item: AgendaItem) => {
        await updateAgenda({ ...item, visible: !item.visible });
    };

    const handleTogglePin = async (item: AgendaItem, e: React.MouseEvent) => {
        e.stopPropagation();
        await updateAgenda({ ...item, pinned: !item.pinned });
    };

    const filteredEvents = agendaList.filter(event =>
        event.type === activeTab && (isEditMode || event.visible)
    );

    return (
        <>
            <div className="rounded-xl shadow-sm p-4 mb-6" style={{ backgroundColor: '#2a1215' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: '#ffef43' }} />
                        <h2 className="text-lg font-semibold" style={{ color: '#ffef43' }}>Agenda</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditMode && (
                            <button
                                onClick={() => onAdd(activeTab)}
                                className="p-1.5 rounded-full hover:opacity-80 transition-opacity mr-2"
                                style={{ backgroundColor: 'rgba(255, 239, 67, 0.2)', color: '#ffef43' }}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}

                        <div className="flex rounded-lg p-1" style={{ backgroundColor: '#361b1c' }}>
                            <button
                                onClick={() => setActiveTab('escalas')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all`}
                                style={activeTab === 'escalas' ? { backgroundColor: '#c89800', color: 'white' } : { color: '#9ca3af' }}
                            >
                                Escalas
                            </button>
                            <button
                                onClick={() => setActiveTab('ensaios')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all`}
                                style={activeTab === 'ensaios' ? { backgroundColor: '#c89800', color: 'white' } : { color: '#9ca3af' }}
                            >
                                Ensaios
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredEvents.map(event => (
                        <div
                            key={event.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${!event.visible ? 'opacity-50' : ''}`}
                            style={{
                                backgroundColor: 'rgba(54, 27, 28, 0.5)',
                                borderColor: event.pinned ? '#ffef43' : 'rgba(255, 239, 67, 0.2)'
                            }}
                        >
                            <div className="flex flex-col flex-1 mr-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {event.type === 'ensaios' ? (
                                            <Users className="w-4 h-4" style={{ color: '#ffef43' }} />
                                        ) : (
                                            <Briefcase className="w-4 h-4" style={{ color: '#10b981' }} />
                                        )}
                                        <span className="font-medium text-white flex items-center gap-2">
                                            {event.title}
                                            {event.pinned && <Pin className="w-3 h-3 text-[#ffef43] fill-[#ffef43]" />}
                                        </span>
                                    </div>
                                    {isEditMode && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => handleTogglePin(event, e)}
                                                className={`p-1 transition-colors ${event.pinned ? 'text-[#ffef43]' : 'text-gray-400 hover:text-[#ffef43]'}`}
                                            >
                                                <Pin className={`w-3 h-3 ${event.pinned ? 'fill-[#ffef43]' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleVisibility(event)}
                                                className="p-1 text-gray-400 transition-colors"
                                                style={{ color: '#9ca3af' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#ffef43'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                            >
                                                {event.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            </button>
                                            <button
                                                onClick={() => setEditingItem(event)}
                                                className="p-1 text-gray-400 transition-colors"
                                                style={{ color: '#9ca3af' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#ffef43'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm text-gray-400 ml-6">{event.time} • {event.location}</span>
                            </div>
                            <div
                                className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                                style={event.type === 'ensaios'
                                    ? { backgroundColor: 'rgba(255, 239, 67, 0.2)', color: '#ffef43' }
                                    : { backgroundColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }
                                }
                            >
                                {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                        </div>
                    ))}
                    {filteredEvents.length === 0 && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                            Nenhum evento encontrado.
                        </div>
                    )}
                </div>
            </div>

            <AddItemModal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                type="agenda"
                initialData={editingItem}
            />
        </>
    );
};
