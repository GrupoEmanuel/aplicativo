import { useEffect, useRef } from 'react';

export const useWakeLock = (isActive: boolean) => {
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator && isActive) {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log('Wake Lock activated');
                }
            } catch (err) {
                console.error('Wake Lock request failed:', err);
            }
        };

        const releaseWakeLock = async () => {
            try {
                if (wakeLockRef.current) {
                    await wakeLockRef.current.release();
                    wakeLockRef.current = null;
                    console.log('Wake Lock released');
                }
            } catch (err) {
                console.error('Wake Lock release failed:', err);
            }
        };

        if (isActive) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }

        // Re-request wake lock if visibility changes (user switches tabs)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isActive) {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            releaseWakeLock();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isActive]);

    return wakeLockRef;
};
