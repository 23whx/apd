import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { WorksPage } from './pages/WorksPage';
import { WorkDetailPage } from './pages/WorkDetailPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubmitWorkPage } from './pages/SubmitWorkPage';
import { AdminPage } from './pages/AdminPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import './lib/i18n';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-eva-bg text-eva-text font-sans selection:bg-eva-secondary selection:text-eva-bg flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/works" element={<WorksPage />} />
              <Route path="/works/:id" element={<WorkDetailPage />} />
              <Route path="/characters/:id" element={<CharacterDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/submit" element={<SubmitWorkPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
