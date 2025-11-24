import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Music } from 'lucide-react';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { AppProvider } from './store/AppContext';
import { LocalUserProvider } from './store/LocalUserContext';
import { Home } from './pages/Home';
import { MusicLibrary } from './pages/MusicLibrary';

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

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listener para deep links (quando app é aberto via link)
    CapacitorApp.addListener('appUrlOpen', (event) => {
      const url = event.url;
      console.log('Deep link received:', url);

      // Parsear links: https://grupoemanuel.com.br/musicas?... ou grupoemanuel://musicas?...
      if (url.includes('musicas')) {
        const params = url.split('?')[1];
        if (params) {
          // Navegar para /music com os parâmetros
          navigate(`/music#?${params}`);
        }
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);

  return null;
};

function App() {
  return (
    <AppProvider>
      <LocalUserProvider>
        <Router>
          <DeepLinkHandler />
          <div className="font-sans text-gray-900 antialiased">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/music" element={<MusicLibrary />} />
            </Routes>
            <Navigation />
          </div>
        </Router>
      </LocalUserProvider>
    </AppProvider>
  );
}

export default App;
