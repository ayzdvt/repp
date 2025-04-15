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
              <li>Email: info@archifrost.com</li>
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