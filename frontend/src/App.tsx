import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { WorksPage } from './pages/WorksPage';
import { WorkDetailPage } from './pages/WorkDetailPage';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubmitWorkPage } from './pages/SubmitWorkPage';
import { SubmitCharacterPage } from './pages/SubmitCharacterPage';
import { AdminPage } from './pages/AdminPage';
import { AdminWorksPage } from './pages/AdminWorksPage';
import { AdminCharactersPage } from './pages/AdminCharactersPage';
import { EditWorkPage } from './pages/EditWorkPage';
import { EditCharacterPage } from './pages/EditCharacterPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { AdminBlogPage } from './pages/AdminBlogPage';
import { AdminWriteBlogPage } from './pages/AdminWriteBlogPage';
import { AdminReferBlogPage } from './pages/AdminReferBlogPage';
import { detectAndSetLanguage } from './lib/geoLanguage';
import './lib/i18n';

function AppContent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Detect language based on IP on first visit
    const initLanguage = async () => {
      const detectedLang = await detectAndSetLanguage();
      if (detectedLang && detectedLang !== i18n.language) {
        await i18n.changeLanguage(detectedLang);
        console.log('[App] Language set to:', detectedLang);
      }
    };

    initLanguage();
  }, []); // Run only once on mount

  return (
    <div className="min-h-screen bg-eva-bg text-eva-text font-sans selection:bg-eva-secondary selection:text-eva-bg flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/works/:id" element={<WorkDetailPage />} />
          <Route path="/works/:workId/submit-character" element={<SubmitCharacterPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/characters/:id" element={<CharacterDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/submit" element={<SubmitWorkPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/works" element={<AdminWorksPage />} />
          <Route path="/admin/works/:id/edit" element={<EditWorkPage />} />
          <Route path="/admin/characters" element={<AdminCharactersPage />} />
          <Route path="/admin/characters/:id/edit" element={<EditCharacterPage />} />
          <Route path="/admin/blog" element={<AdminBlogPage />} />
          <Route path="/admin/blog/write" element={<AdminWriteBlogPage />} />
          <Route path="/admin/blog/refer" element={<AdminReferBlogPage />} />
          <Route path="/admin/blog/edit/:id" element={<AdminWriteBlogPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          {/* Localized blog routes (recommended for global audience) */}
          <Route path="/:lang/blog" element={<BlogPage />} />
          <Route path="/:lang/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
