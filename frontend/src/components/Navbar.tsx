import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Hexagon, Globe, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    if (user) {
      // 尝试从缓存读取
      const cacheKey = `user_display_name_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        setDisplayName(cached);
      } else {
        // 没有缓存时使用邮箱前缀作为临时显示
        const fallbackName = user.email?.split('@')[0] || 'User';
        setDisplayName(fallbackName);
      }
      
      // 延迟获取完整信息（防抖）
      const timer = setTimeout(() => {
        fetchUserProfile();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setDisplayName('');
    }
  }, [user?.id]); // 只依赖 user.id，避免频繁触发

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ display_name?: string; username?: string }>;
      const detail = customEvent.detail || {};
      const fallbackName = user?.email?.split('@')[0] || 'User';
      const name = detail.display_name || detail.username || fallbackName;
      setDisplayName(name);
      
      // 更新缓存
      if (user) {
        localStorage.setItem(`user_display_name_${user.id}`, name);
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdated as EventListener);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated as EventListener);
    };
  }, [user?.id, user?.email]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      if (error) return;

      if (data) {
        const name = data.display_name || data.username || user.email?.split('@')[0] || 'User';
        setDisplayName(name);
        
        // 缓存结果
        localStorage.setItem(`user_display_name_${user.id}`, name);
      }
    } catch (error) {
      // 静默失败
    }
  };

  const toggleLanguage = () => {
    const languages = ['en', 'zh', 'ja'];
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex]);
  };

  const getLanguageLabel = () => {
    const labels: Record<string, string> = { en: 'EN', zh: '中', ja: '日' };
    return labels[i18n.language] || 'EN';
  };

  return (
    <>
      <nav className="border-b border-white/10 bg-eva-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <Hexagon className="w-8 h-8 text-eva-secondary fill-eva-secondary/20" />
                <span className="text-xl font-bold tracking-wider text-white">
                  APD <span className="text-eva-secondary text-xs align-top">v0.1</span>
                </span>
              </Link>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link
                  to="/works"
                  className="hover:text-eva-secondary transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.works')}
                </Link>
                <Link
                  to="/characters"
                  className="hover:text-eva-secondary transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.characters')}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-full hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <Globe className="w-5 h-5 text-gray-400 hover:text-eva-secondary" />
                <span className="text-xs font-bold text-gray-400">{getLanguageLabel()}</span>
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-eva-accent/20 hover:bg-eva-accent/40 border border-eva-accent/50 px-4 py-1.5 rounded text-sm font-medium text-eva-accent transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{displayName || user.email?.split('@')[0]}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-eva-surface border border-white/10 rounded-lg shadow-lg py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {t('nav.profile')}
                      </Link>
                      <Link
                        to="/submit"
                        className="block px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Submit Work
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors text-red-400"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 bg-eva-accent/20 hover:bg-eva-accent/40 border border-eva-accent/50 px-4 py-1.5 rounded text-sm font-medium text-eva-accent transition-all"
                >
                  <User className="w-4 h-4" />
                  {t('nav.login')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

