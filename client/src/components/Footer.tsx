import React from 'react';
import { Link } from 'wouter';
import logoTransparent from '../assets/img/archifrost-logo-transparent.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logoTransparent} alt="ArchiFrost Logo" className="h-16 w-auto mb-4" />
            <p className="text-gray-300 text-sm">
              Yapay zekâ destekli, otomatik mimari çizim ve revizyon çözümleri ile profesyonellere zaman kazandırıyoruz.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Hızlı Erişim</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/"><div className="hover:text-blue-400 cursor-pointer">Ana Sayfa</div></Link></li>
              <li><a href="#features" className="hover:text-blue-400">Özellikler</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">İletişim</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>Email: bilgi@archifrost.com</li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Destek</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><a href="#" className="hover:text-blue-400">SSS</a></li>
              <li><a href="#" className="hover:text-blue-400">Yardım Merkezi</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <div className="flex justify-center space-x-4 mb-4">
            <a href="https://www.instagram.com/archifrost/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://x.com/archifrost_" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
          </div>
          <p>© 2025 ArchiFrost. Tüm hakları saklıdır.</p>
          <p className="mt-2">
            <a href="#" className="hover:text-blue-400">KVKK Aydınlatma Metni</a> | 
            <a href="#" className="hover:text-blue-400 ml-3">Kullanım Şartları</a> | 
            <a href="#" className="hover:text-blue-400 ml-3">Gizlilik Politikası</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;