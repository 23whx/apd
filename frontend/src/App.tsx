import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
// The landing page stays in the main bundle; every other route is split into its own chunk
import { HomePage } from './pages/HomePage';
import { detectAndSetLanguage, getUrlLanguage, markLanguageReady } from './lib/geoLanguage';
import './lib/i18n';

const WorksPage = lazy(() => import('./pages/WorksPage').then((m) => ({ default: m.WorksPage })));
const WorkDetailPage = lazy(() => import('./pages/WorkDetailPage').then((m) => ({ default: m.WorkDetailPage })));
const CharactersPage = lazy(() => import('./pages/CharactersPage').then((m) => ({ default: m.CharactersPage })));
const CharacterDetailPage = lazy(() => import('./pages/CharacterDetailPage').then((m) => ({ default: m.CharacterDetailPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SubmitWorkPage = lazy(() => import('./pages/SubmitWorkPage').then((m) => ({ default: m.SubmitWorkPage })));
const SubmitCharacterPage = lazy(() => import('./pages/SubmitCharacterPage').then((m) => ({ default: m.SubmitCharacterPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AdminWorksPage = lazy(() => import('./pages/AdminWorksPage').then((m) => ({ default: m.AdminWorksPage })));
const AdminCharactersPage = lazy(() => import('./pages/AdminCharactersPage').then((m) => ({ default: m.AdminCharactersPage })));
const EditWorkPage = lazy(() => import('./pages/EditWorkPage').then((m) => ({ default: m.EditWorkPage })));
const EditCharacterPage = lazy(() => import('./pages/EditCharacterPage').then((m) => ({ default: m.EditCharacterPage })));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage })));
const AdminBlogPage = lazy(() => import('./pages/AdminBlogPage').then((m) => ({ default: m.AdminBlogPage })));
const AdminWriteBlogPage = lazy(() => import('./pages/AdminWriteBlogPage').then((m) => ({ default: m.AdminWriteBlogPage })));
const AdminReferBlogPage = lazy(() => import('./pages/AdminReferBlogPage').then((m) => ({ default: m.AdminReferBlogPage })));
const MbtiIndexPage = lazy(() => import('./pages/MbtiIndexPage').then((m) => ({ default: m.MbtiIndexPage })));
const MbtiTypePage = lazy(() => import('./pages/MbtiTypePage').then((m) => ({ default: m.MbtiTypePage })));

const RouteFallback = () => (
  <div className="flex items-center justify-center py-32">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-eva-secondary"></div>
  </div>
);

function AppContent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const initLanguage = async () => {
      try {
        // An explicit language in the URL (/zh/blog/...) wins; the page syncs i18n to it, so skip geo-detection
        if (getUrlLanguage(window.location.pathname)) return;

        // Detect language based on IP on first visit
        const detectedLang = await detectAndSetLanguage();
        if (detectedLang && detectedLang !== i18n.language) {
          await i18n.changeLanguage(detectedLang);
        }
      } finally {
        markLanguageReady();
      }
    };

    initLanguage();
  }, []); // Run only once on mount

  // Keep <html lang> in sync with the UI language (pages with their own content language override it via useSeo)
  useEffect(() => {
    const lang = i18n.language || 'en';
    document.documentElement.lang = lang.startsWith('zh') ? 'zh-CN' : lang.startsWith('ja') ? 'ja' : 'en';
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-eva-bg text-eva-text font-sans selection:bg-eva-secondary selection:text-eva-bg flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/works/:id" element={<WorkDetailPage />} />
          <Route path="/works/:workId/submit-character" element={<SubmitCharacterPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/characters/:id" element={<CharacterDetailPage />} />
          <Route path="/mbti" element={<MbtiIndexPage />} />
          <Route path="/mbti/:type" element={<MbtiTypePage />} />
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
        </Suspense>
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
