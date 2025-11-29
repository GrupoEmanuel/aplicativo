import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions';

/**
 * Service to handle runtime permissions using Cordova Android Permissions
 * This ensures permissions are properly requested on Android 6+
 */
export const permissionsService = {
    /**
     * Request microphone permission (for Tuner feature)
     */
    /**
     * Request storage permissions using Capacitor Filesystem
     * This is the recommended way for Capacitor apps
     */
    async checkStoragePermissions(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            return true;
        }

        try {
            const status = await Filesystem.checkPermissions();

            // If already granted, return true
            if (status.publicStorage === 'granted') {
                return true;
            }

            // Request permission explicitly
            const request = await Filesystem.requestPermissions();

            // Check result
            return request.publicStorage === 'granted';

        } catch (error) {
            console.error('Error checking/requesting storage permissions:', error);
            return false;
        }
    },
    /**
     * Request all necessary permissions on app startup
     */
    async requestAllPermissions(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        try {
            const permissions = [
                AndroidPermissions.PERMISSION.CAMERA,
                AndroidPermissions.PERMISSION.RECORD_AUDIO,
                AndroidPermissions.PERMISSION.POST_NOTIFICATIONS,
                AndroidPermissions.PERMISSION.READ_MEDIA_IMAGES,
                AndroidPermissions.PERMISSION.READ_MEDIA_VIDEO,
                AndroidPermissions.PERMISSION.READ_MEDIA_AUDIO,
            ];

            console.log('🚀 Requesting all permissions...');
            await AndroidPermissions.requestPermissions(permissions);

            // Also ensure Filesystem permissions are checked for public storage
            await this.checkStoragePermissions();

            console.log('✅ All permission requests completed');
        } catch (error) {
            console.error('Error requesting permissions:', error);
        }
    },

    /**
     * Request microphone permission (for Tuner feature)
     */
    async requestMicrophone(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            return true;
        }

        try {
            const permission = AndroidPermissions.PERMISSION.RECORD_AUDIO;

            // Check if permission is already granted
            const check = await AndroidPermissions.checkPermission(permission);
            if (check.hasPermission) {
                console.log('✅ Microphone permission already granted');
                return true;
            }

            // Request permission if not granted
            console.log('🎤 Requesting microphone permission...');
            const result = await AndroidPermissions.requestPermission(permission);

            if (result.hasPermission) {
                console.log('✅ Microphone permission granted');
                return true;
            } else {
                console.warn('❌ Microphone permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting microphone permission:', error);
            return false;
        }
    }
};

