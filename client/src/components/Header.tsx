import React from 'react';
import { Link } from 'wouter';
import logoSrc from '../assets/logo.svg';

interface HeaderProps {
  variant?: 'landing' | 'app';
}

const Header: React.FC<HeaderProps> = ({ variant = 'app' }) => {
  if (variant === 'landing') {
    return (
      <header className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center">
                <img src={logoSrc} alt="ArchiFrost Logo" className="h-8" />
              </a>
            </Link>
            <nav className="ml-10 hidden md:flex space-x-8">
              <Link href="/">
                <a className="text-gray-700 hover:text-blue-600 font-medium">Ana Sayfa</a>
              </Link>
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium">Özellikler</a>
              <a href="#comparison" className="text-gray-700 hover:text-blue-600 font-medium">Karşılaştırma</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium">Referanslar</a>
              <Link href="/options">
                <a className="text-gray-700 hover:text-blue-600 font-medium">Çözümler</a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/options">
              <a className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium hidden sm:inline-block">
                Demo İzle
              </a>
            </Link>
            <Link href="/options">
              <a className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
                Ücretsiz Deneyin
              </a>
            </Link>
          </div>
        </div>
      </header>
    );
  }
  
  // Default app header
  return (
    <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <a>
            <img src={logoSrc} alt="ArchiFrost Logo" className="h-8 mr-4" />
          </a>
        </Link>
        <h1 className="text-xl font-semibold text-gray-700">CAD Çizim Aracı</h1>
        <div className="ml-8 flex space-x-4">
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Dosya</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Düzenle</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Görünüm</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Araçlar</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Yardım</button>
        </div>
      </div>
      <div>
        <button className="px-3 py-1 text-sm bg-[#0066CC] text-white rounded hover:bg-blue-700">Giriş Yap</button>
      </div>
    </header>
  );
};

export default Header;
