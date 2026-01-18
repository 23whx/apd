import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hexagon } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const getCurrentLang = () => {
    const lang = i18n.language;
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  };

  return (
    <footer className="bg-black py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Hexagon className="w-6 h-6 text-eva-secondary" />
              <span className="text-white font-bold text-lg">APD</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a href="https://x.com/Rollkey4" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-eva-secondary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="mailto:wanghongxiang23@gmail.com" className="text-gray-500 hover:text-eva-secondary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-500 hover:text-eva-secondary transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to={`/${getCurrentLang()}/blog`} className="text-gray-500 hover:text-eva-secondary transition-colors">
                  {t('nav.blog')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-500 hover:text-eva-secondary transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-500 hover:text-eva-secondary transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Related Projects */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm">{t('footer.relatedProjects')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://oumashu.top" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-eva-secondary transition-colors flex items-center gap-1">
                  OumaShu
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://efortunetell.blog" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-eva-secondary transition-colors flex items-center gap-1">
                  eFortuneTell
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 text-center text-xs text-gray-700">
          <p>{t('footer.copyright')}</p>
          <p className="mt-2">
            {t('footer.madeWith')} <span className="text-eva-secondary">💚</span> {t('footer.byRollkey')}
          </p>
        </div>
      </div>
    </footer>
  );
};

