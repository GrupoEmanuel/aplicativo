import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
    selectedDate: Date | null;
    onChange: (date: Date) => void;
    onClose: () => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Reset to current month/year when opening, or selected date's month if exists
    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        } else {
            const now = new Date();
            setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        }
    }, []); // Run once on mount

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        onChange(newDate);
        onClose();
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            date.setHours(0, 0, 0, 0);

            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            days.push(
                <button
                    key={day}
                    onClick={() => !isPast && handleDateClick(day)}
                    disabled={isPast}
                    className={`
                        h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors
                        ${isPast ? 'text-white/20 cursor-not-allowed' : 'hover:bg-[#ffef43]/20 text-white'}
                        ${isToday ? 'border border-[#ffef43] text-[#ffef43] font-bold' : ''}
                        ${isSelected ? 'bg-[#ffef43] text-[#2a1215] font-bold hover:bg-[#ffef43]' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return (
        <div className="absolute top-full left-0 mt-2 p-4 bg-[#2a1215] border border-[#ffef43]/30 rounded-xl shadow-xl z-50 w-64">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-[#ffef43]/10 rounded-full text-[#ffef43]">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[#ffef43] font-medium">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-[#ffef43]/10 rounded-full text-[#ffef43]">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={i} className="h-8 w-8 flex items-center justify-center text-xs text-[#ffef43]/60 font-medium">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>

            {/* Backdrop to close when clicking outside */}
            <div className="fixed inset-0 -z-10" onClick={onClose} />
        </div>
    );
};
