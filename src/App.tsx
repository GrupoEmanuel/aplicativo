import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import { Home as HomeIcon, Music } from 'lucide-react';
import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AppProvider, useApp } from './store/AppContext';
import { LocalUserProvider } from './store/LocalUserContext';
import { AudioProvider } from './store/AudioContext';
import { Home } from './pages/Home';
import { MusicLibrary } from './pages/MusicLibrary';
import { notificationService } from './services/NotificationService';
import { permissionsService } from './services/permissions';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t pb-safe" style={{ backgroundColor: '#2a1215', borderColor: 'rgba(255, 239, 67, 0.2)' }}>
      <div className="flex justify-around items-center h-16">
        <Link
          to="/"
          className="flex flex-col items-center justify-center w-full h-full space-y-1"
          style={{ color: isActive('/') ? '#ffef43' : '#9ca3af' }}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Início</span>
        </Link>

        <Link
          to="/music"
          className="flex flex-col items-center justify-center w-full h-full space-y-1"
          style={{ color: isActive('/music') ? '#ffef43' : '#9ca3af' }}
        >
          <Music className="w-6 h-6" />
          <span className="text-xs font-medium">Músicas</span>
        </Link>
      </div>
    </nav>
  );
};

const NotificationHandler = () => {
  const { agendaList } = useApp();

  useEffect(() => {
    const init = async () => {
      await notificationService.init();
      if (agendaList.length > 0) {
        await notificationService.scheduleAgendaNotifications(agendaList);
      }
    };
    init();

    // Listener for foreground notifications
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      notificationService.handleNotificationReceived(notification);
    });

    // Listener for notification tap
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      notificationService.handleNotificationReceived(notification.notification);
    });

    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, [agendaList]);

  return null;
};

function App() {
  //  Request file access on app startup
  useEffect(() => {
    const initPermissions = async () => {
      await permissionsService.requestFileAccess();
    };

    initPermissions();
  }, []);

  return (
    <AppProvider>
      <LocalUserProvider>
        <AudioProvider>
          <Router>
            <NotificationHandler />
            <div className="font-sans text-gray-900 antialiased">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/music" element={<MusicLibrary />} />
              </Routes>
              <Navigation />
            </div>
          </Router>
        </AudioProvider>
      </LocalUserProvider>
    </AppProvider>
  );
}

export default App;
