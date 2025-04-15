import React from 'react';
import { Link, useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function OptionsPage() {
  const [, setLocation] = useLocation();
  
  // Dosya yükleme diyaloğu yerine doğrudan analiz sayfasına yönlendir
  const handleAIOptionSelect = () => {
    setLocation('/analysis');
  };
  
  // CAD sayfasına yönlendir
  const handleCADOption = () => {
    setLocation('/cad');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - options variant for no "try free" button */}
      <Header variant="options" />
      
      <div className="flex-grow bg-gradient-to-b from-blue-900 to-blue-800 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              <span className="block">Keşfedin ve</span>
              <span className="block text-blue-300 mt-2">Katkıda Bulunun</span>
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-4xl mx-auto">
              Siz de çalışmalar denemeler yapıp projeyi deneyimleyin. Gelişimine katkıda bulunun.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Yapay Zeka ile Veri Çıkarma */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-all hover:scale-105">
              <div className="p-6 h-full flex flex-col">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Yapay Zeka Aracılığı ile Verilerimi Çıkart</h2>
                  <p className="text-gray-600 mb-6">
                    Yapay zeka destekli araçlarımız ile mevcut belge veya çizimlerden veri çıkarın ve otomatik olarak
                    çizimlere dönüştürün.
                  </p>
                </div>
                <div className="mt-auto">
                  <button 
                    onClick={handleAIOptionSelect}
                    className="block text-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    Seç
                  </button>
                </div>
              </div>
            </div>
            
            {/* AutoCAD Çizimi */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-all hover:scale-105">
              <div className="p-6 h-full flex flex-col">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">AutoCAD Çizimin Üzerine Çalışmaya Devam Et</h2>
                  <p className="text-gray-600 mb-6">
                    Mevcut AutoCAD çiziminizi yükleyin ve çizimlerinizi web tabanlı ortamımızda düzenlemeye devam edin.
                  </p>
                </div>
                <div className="mt-auto">
                  <button 
                    onClick={handleCADOption}
                    className="block text-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    Seç
                  </button>
                </div>
              </div>
            </div>
            
            {/* Manuel Tasarım */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-all hover:scale-105">
              <div className="p-6 h-full flex flex-col">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Manuel Tasarım</h2>
                  <p className="text-gray-600 mb-6">
                    Basit ve kullanımı kolay arayüzümüz ile sıfırdan kendi tasarımlarınızı oluşturun. Nokta, çizgi, polyline ve daha fazlası.
                  </p>
                </div>
                <div className="mt-auto">
                  <Link href="/drawing" className="block text-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
                    Seç
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}