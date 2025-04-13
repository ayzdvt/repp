import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">CAD Web Uygulaması</span>
            <span className="block text-blue-600 mt-2">Çizim Yapın, Tasarlayın</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
            Tarayıcı üzerinde çalışan bu kullanıcı dostu CAD uygulaması ile çizimlerinizi kolayca yapabilirsiniz. 
            Nokta, çizgi, polyline araçlarıyla istediğiniz geometrileri oluşturun.
          </p>
          <div className="mt-10">
            <Link href="/options">
              <Button size="lg" className="px-8 py-6 text-lg">
                Hemen Dene
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Basit Arayüz</h2>
            <p className="text-gray-600">
              Kolay kullanılabilir araç seti ve temiz bir arayüz ile hızlıca çizimlerinizi yapın.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Hassas Kontrol</h2>
            <p className="text-gray-600">
              Snap özelliği ile hassas çizimler yapın, nesnelerin özelliklerini kolayca düzenleyin.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Anında Görüntüleme</h2>
            <p className="text-gray-600">
              Fit View ile tüm çizimleri ekrana sığdırın, koordinat sisteminde konumlandırın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}