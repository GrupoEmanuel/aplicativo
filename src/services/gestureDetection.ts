import { FaceDetection } from '@capacitor-mlkit/face-detection';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export type GestureType = 'nod_up' | 'nod_yes' | 'blink_right' | 'blink_left' | 'none';

export interface GestureEvent {
    type: GestureType;
    timestamp: number;
}

export type GestureCallback = (event: GestureEvent) => void;

export interface GestureConfig {
    toggleScroll: GestureType;
    skipHalfScreen: GestureType;
    closePerformance: GestureType;
    scrollCountdown: number;
}

const DEFAULT_CONFIG: GestureConfig = {
    toggleScroll: 'nod_up',
    skipHalfScreen: 'blink_right',
    closePerformance: 'blink_left',
    scrollCountdown: 5
};

class GestureDetectionService {
    private isRunning = false;
    private callbacks: GestureCallback[] = [];
    private lastEulerX: number | null = null;
    private lastEulerY: number | null = null;
    private lastRightEyeOpen: number | null = null;
    private lastLeftEyeOpen: number | null = null;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private videoElement: HTMLVideoElement | null = null;
    private stream: MediaStream | null = null;
    private config: GestureConfig = DEFAULT_CONFIG;

    async loadConfig(): Promise<void> {
        try {
            const { value } = await Preferences.get({ key: 'gestureConfig' });
            if (value) {
                this.config = JSON.parse(value);
            }
        } catch (error) {
            console.error('Failed to load gesture config:', error);
        }
    }

    async saveConfig(config: GestureConfig): Promise<void> {
        this.config = config;
        try {
            await Preferences.set({
                key: 'gestureConfig',
                value: JSON.stringify(config)
            });
        } catch (error) {
            console.error('Failed to save gesture config:', error);
        }
    }

    getConfig(): GestureConfig {
        return { ...this.config };
    }

    async getEnabled(): Promise<boolean> {
        try {
            const { value } = await Preferences.get({ key: 'gestureEnabled' });
            return value === null ? true : value === 'true'; // Default to true
        } catch (error) {
            console.error('Failed to get gesture enabled state:', error);
            return true;
        }
    }

    async setEnabled(enabled: boolean): Promise<void> {
        try {
            await Preferences.set({
                key: 'gestureEnabled',
                value: enabled.toString()
            });
        } catch (error) {
            console.error('Failed to save gesture enabled state:', error);
        }
    }

    async start(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            console.warn('Gesture detection only works on native platforms');
            return;
        }

        if (this.isRunning) return;

        try {
            await this.loadConfig();

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });

            // Create hidden video element for processing
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.play();

            this.isRunning = true;

            // Process frames at ~10 FPS to save battery
            this.intervalId = setInterval(async () => {
                await this.processFrame();
            }, 100);

        } catch (error) {
            console.error('Failed to start gesture detection:', error);
            this.stop();
        }
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement = null;
        }

        this.isRunning = false;
        this.lastEulerX = null;
        this.lastEulerY = null;
        this.lastRightEyeOpen = null;
        this.lastLeftEyeOpen = null;
    }

    private async processFrame(): Promise<void> {
        if (!this.videoElement) return;

        try {
            // Capture frame from video
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(this.videoElement, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            // Detect faces
            const { faces } = await FaceDetection.processImage({
                path: imageData
            });

            if (faces.length > 0) {
                const face = faces[0];
                this.detectGestures(face);
            }
        } catch (error) {
            console.error('Error processing frame:', error);
        }
    }

    private detectGestures(face: any): void {
        const currentEulerX = face.headEulerAngleX || 0;
        const currentEulerY = face.headEulerAngleY || 0;
        const rightEyeOpen = face.rightEyeOpenProbability ?? 1;
        const leftEyeOpen = face.leftEyeOpenProbability ?? 1;

        // Detect head nod up
        if (this.lastEulerX !== null) {
            const deltaX = currentEulerX - this.lastEulerX;
            if (deltaX > 15) {
                this.emitGesture({ type: 'nod_up', timestamp: Date.now() });
            }
        }

        // Detect head nod yes (affirmative - up and down)
        if (this.lastEulerY !== null) {
            const deltaY = Math.abs(currentEulerY - this.lastEulerY);
            if (deltaY > 20) {
                this.emitGesture({ type: 'nod_yes', timestamp: Date.now() });
            }
        }

        // Detect right eye blink
        if (this.lastRightEyeOpen !== null) {
            if (this.lastRightEyeOpen > 0.8 && rightEyeOpen < 0.2) {
                this.emitGesture({ type: 'blink_right', timestamp: Date.now() });
            }
        }

        // Detect left eye blink
        if (this.lastLeftEyeOpen !== null) {
            if (this.lastLeftEyeOpen > 0.8 && leftEyeOpen < 0.2) {
                this.emitGesture({ type: 'blink_left', timestamp: Date.now() });
            }
        }

        this.lastEulerX = currentEulerX;
        this.lastEulerY = currentEulerY;
        this.lastRightEyeOpen = rightEyeOpen;
        this.lastLeftEyeOpen = leftEyeOpen;
    }

    private emitGesture(event: GestureEvent): void {
        this.callbacks.forEach(callback => callback(event));
    }

    onGesture(callback: GestureCallback): () => void {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    isActive(): boolean {
        return this.isRunning;
    }
}

export const gestureDetectionService = new GestureDetectionService();
