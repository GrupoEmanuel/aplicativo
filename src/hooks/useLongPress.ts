import { useRef, useCallback } from 'react';

interface LongPressOptions {
    onLongPress: (e: React.MouseEvent | React.TouchEvent) => void;
    onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
    ms?: number;
}

export const useLongPress = ({ onLongPress, onClick, ms = 500 }: LongPressOptions) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isLongPress = useRef(false);

    const startPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        isLongPress.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            onLongPress(e);
        }, ms);
    }, [onLongPress, ms]);

    const stopPress = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    }, []);

    const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (isLongPress.current) {
            return;
        }
        if (onClick) {
            onClick(e);
        }
    }, [onClick]);

    return {
        onMouseDown: startPress,
        onMouseUp: stopPress,
        onMouseLeave: stopPress,
        onTouchStart: startPress,
        onTouchEnd: stopPress,
        onTouchMove: stopPress, // Cancel on move to allow scrolling
        onClick: handleClick
    };
};
