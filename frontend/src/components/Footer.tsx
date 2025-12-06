import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hexagon } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-black py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Hexagon className="w-6 h-6 text-gray-600" />
            <span className="text-gray-400 font-bold">ACGN Personality Database</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/about" className="hover:text-white transition-colors">
              {t('footer.about')}
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-gray-700">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
};

