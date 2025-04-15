import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
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
