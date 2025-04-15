import React, { useState } from 'react';
import { Link } from 'wouter';
import logoSrc from '../assets/img/archifrost-logo-blue.png';
import FeedbackDialog from '@/components/FeedbackDialog';

interface HeaderProps {
  variant?: 'landing' | 'app' | 'options';
}

const Header: React.FC<HeaderProps> = ({ variant = 'app' }) => {
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  if (variant === 'landing' || variant === 'options') {
    return (
      <header className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img src={logoSrc} alt="ArchiFrost Logo" className="h-12" />
              </div>
            </Link>
            <nav className="ml-10 hidden md:flex space-x-8">
              <Link href="/">
                <div className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer">Ana Sayfa</div>
              </Link>
              {variant === 'landing' ? (
                <>
                  <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium">Özellikler</a>
                  <a href="#comparison" className="text-gray-700 hover:text-blue-600 font-medium">Karşılaştırma</a>
                </>
              ) : (
                <>
                  <Link href="/#features">
                    <div className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer">Özellikler</div>
                  </Link>
                  <Link href="/#comparison">
                    <div className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer">Karşılaştırma</div>
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            {/* Sadece ana sayfada göster, options sayfasında gösterme */}
            {variant === 'landing' && (
              <Link href="/options">
                <div className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer">
                  Ücretsiz Deneyin
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }
  
  // Default app header
  return (
    <>
      <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="cursor-pointer">
              <img src={logoSrc} alt="ArchiFrost Logo" className="h-10 mr-4" />
            </div>
          </Link>
        </div>
        <div>
          <button 
            onClick={() => setIsFeedbackDialogOpen(true)}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Geribildirim Gönder
          </button>
        </div>
      </header>
      
      {/* Geribildirim Dialog Bileşeni */}
      <FeedbackDialog 
        isOpen={isFeedbackDialogOpen}
        onClose={() => setIsFeedbackDialogOpen(false)}
      />
    </>
  );
};

export default Header;
