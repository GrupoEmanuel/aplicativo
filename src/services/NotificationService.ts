import { LocalNotifications } from '@capacitor/local-notifications';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { type AgendaItem } from './drive';

class NotificationService {
    private hasPermission = false;

    async init() {
        try {
            const permission = await LocalNotifications.requestPermissions();
            this.hasPermission = permission.display === 'granted';

            if (this.hasPermission) {
                await this.createChannel();
            }
        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
    }

    private async createChannel() {
        try {
            await LocalNotifications.createChannel({
                id: 'agenda_channel',
                name: 'Agenda do Grupo',
                description: 'Notificações de ensaios e escalas',
                importance: 5,
                visibility: 1,
                vibration: true,
            });
        } catch (error) {
            // Ignore "Not implemented on web" error
            if (JSON.stringify(error).includes('Not implemented') || (error as any)?.message?.includes('Not implemented')) {
                console.log('Notification channels not supported on this platform');
                return;
            }
            console.error('Error creating notification channel:', error);
        }
    }

    async scheduleAgendaNotifications(agendaItems: AgendaItem[]) {
        if (!this.hasPermission) return;

        try {
            // Cancel existing notifications to avoid duplicates
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }

            const notifications = [];
            const now = new Date();

            for (const item of agendaItems) {
                if (!item.visible) continue;

                const eventDate = new Date(item.date + 'T08:01:00'); // 8:01 AM on the event day

                // Only schedule if it's in the future
                if (eventDate > now) {
                    notifications.push({
                        title: `Agenda de Hoje: ${item.type === 'ensaios' ? 'Ensaio' : 'Escala'}`,
                        body: item.title,
                        id: Math.abs(this.hashCode(item.id)), // Simple hash for ID
                        schedule: { at: eventDate },
                        channelId: 'agenda_channel',
                        extra: {
                            type: item.type,
                            title: item.title
                        }
                    });
                }
            }

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
                console.log(`Scheduled ${notifications.length} notifications`);
            }
        } catch (error) {
            console.error('Error scheduling notifications:', error);
        }
    }

    async speak(text: string) {
        try {
            await TextToSpeech.speak({
                text,
                lang: 'pt-BR',
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                category: 'ambient',
            });
        } catch (error) {
            console.error('Error using TTS:', error);
        }
    }

    async handleNotificationReceived(notification: any) {
        // When notification is received (foreground) or tapped
        const { type, title } = notification.extra || {};
        if (type && title) {
            const text = `Agenda de hoje: ${type === 'ensaios' ? 'Ensaio' : 'Escala'} ${title}`;
            await this.speak(text);
        }
    }

    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}

export const notificationService = new NotificationService();
