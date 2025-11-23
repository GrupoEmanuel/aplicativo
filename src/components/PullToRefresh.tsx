import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const threshold = 100; // px to pull to trigger refresh

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY === 0) return;
        const y = e.touches[0].clientY;
        const diff = y - startY;

        if (diff > 0 && window.scrollY === 0) {
            setCurrentY(diff);
            // Prevent default pull-to-refresh from browser if possible, 
            // but be careful not to block scrolling
            if (diff < threshold * 1.5) {
                // e.preventDefault(); // This might be too aggressive
            }
        }
    };

    const handleTouchEnd = async () => {
        if (currentY > threshold) {
            setRefreshing(true);
            setCurrentY(threshold); // Snap to threshold
            await onRefresh();
            setRefreshing(false);
        }
        setStartY(0);
        setCurrentY(0);
    };

    return (
        <div
            ref={contentRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="min-h-screen relative"
        >
            {/* Refresh Indicator */}
            <div
                className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none transition-transform duration-200 ease-out"
                style={{
                    height: `${threshold}px`,
                    transform: `translateY(${currentY > 0 ? currentY - threshold : -threshold}px)`,
                    opacity: currentY > 0 ? Math.min(currentY / threshold, 1) : 0
                }}
            >
                <div className={`bg-white dark:bg-gray-800 rounded-full p-2 shadow-md ${refreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${currentY > 0 ? currentY * 0.4 : 0}px)`,
                    transition: refreshing ? 'transform 0.2s' : 'none'
                }}
            >
                {children}
            </div>
        </div>
    );
};
