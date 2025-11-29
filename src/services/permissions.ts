import { Capacitor } from '@capacitor/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions';

/**
 * Service to handle runtime permissions using Cordova Android Permissions
 * This ensures permissions are properly requested on Android 6+
 */
export const permissionsService = {
    /**
     * Request microphone permission (for Tuner feature)
     */
    async requestMicrophone(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            return true; // Browser doesn't need explicit permission request
        }

        try {
            const permission = AndroidPermissions.PERMISSION.RECORD_AUDIO;

            // 1. Check if already granted
            const check = await AndroidPermissions.checkPermission(permission);
            if (check.hasPermission) {
                console.log('✅ Microphone permission already granted');
                return true;
            }

            // 2. Request permission (shows OS popup)
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
    },

    /**
     * Request file/media access permission
     * On Android 13+, uses READ_MEDIA_AUDIO
     * On older versions, uses READ_EXTERNAL_STORAGE
     */
    async requestFileAccess(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            return true;
        }

        try {
            // Request both permissions to cover Android 13+ and older versions
            const permissions = [
                AndroidPermissions.PERMISSION.READ_MEDIA_AUDIO, // Android 13+
                AndroidPermissions.PERMISSION.READ_EXTERNAL_STORAGE // Android 12-
            ];

            console.log('📂 Requesting file access permissions...');
            const result = await AndroidPermissions.requestPermissions(permissions);

            if (result.hasPermission) {
                console.log('✅ File access permission granted');
                return true;
            } else {
                console.warn('❌ File access permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting file access permission:', error);
            return false;
        }
    },

    /**
     * Check if app has necessary permissions
     */
    async checkPermissions(): Promise<{
        microphone: boolean;
        files: boolean;
    }> {
        if (!Capacitor.isNativePlatform()) {
            return {
                microphone: true,
                files: true
            };
        }

        try {
            const mic = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.RECORD_AUDIO);

            // Check both modern and legacy file permissions
            const audioModern = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.READ_MEDIA_AUDIO);
            const audioLegacy = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.READ_EXTERNAL_STORAGE);

            return {
                microphone: mic.hasPermission,
                files: audioModern.hasPermission || audioLegacy.hasPermission
            };
        } catch (error) {
            console.error('Error checking permissions:', error);
            return {
                microphone: false,
                files: false
            };
        }
    }
};

