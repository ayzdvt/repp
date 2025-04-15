import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ComparisonTable from '@/components/ComparisonTable';
import FeatureCard from '@/components/FeatureCard';
import Testimonial from '@/components/Testimonial';
import heroImage1 from '../assets/img/1.jpg';
import heroImage2 from '../assets/img/2.jpg';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header variant="landing" />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={heroImage2} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-900/70"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white py-16">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                <span className="block text-white">Mimari Çizimleriniz</span>
                <span className="block text-blue-300 mt-2">Dakikalar İçinde Hazır</span>
              </h1>
              <p className="mt-6 text-xl text-blue-100 max-w-2xl">
                ArchiFrost, yapay zekâ destekli otomasyon sayesinde, manuel çizim ve revizyon sürecini dakikalara indirir.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/options">
                  <Button size="lg" className="px-8 py-6 text-lg bg-blue-500 hover:bg-blue-400 text-white shadow-lg hover:shadow-xl">
                    Hemen Başla
                  </Button>
                </Link>
                <Link href="/options">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg text-white border-white hover:bg-blue-800/30">
                    Demo İzle
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block p-4 bg-gradient-to-br from-blue-800/50 to-blue-900/50 backdrop-blur-sm rounded-xl shadow-2xl">
              <img src={heroImage1} alt="ArchiFrost Çizim Örneği" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Yapay Zekâ Destekli Mimari Çözümler</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              ArchiFrost, mimarların ve inşaat profesyonellerinin çalışma şeklini dönüştürüyor.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="İmar Belgesi Analizi"
              description="Belgelerdeki kritik bilgileri otomatik olarak çıkarır ve projenizi yerel mevzuata uygun hale getirir."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              metric="%70 daha hızlı analiz"
            />
            <FeatureCard
              title="Otomatik Taslak Oluşturma"
              description="İmar şartlarını dikkate alarak, en uygun yapı taslağını dakikalar içinde oluşturur."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              metric="Başlangıç süresi %50 kısaldı"
            />
            <FeatureCard
              title="Hızlı Revizyon"
              description="Yapı değişikliklerini anında uygular, tüm çizimleri otomatik olarak günceller."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              metric="Revizyon süresi %80 azaldı"
            />
            <FeatureCard
              title="Yerel Mevzuata Uyum"
              description="Mimari çizimlerin yerel imar şartlarına uygunluğunu otomatik olarak kontrol eder."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              metric="Uyum hataları %90 azaldı"
            />
            <FeatureCard
              title="Zaman ve Maliyet Tasarrufu"
              description="Mimari süreçleri otomatize ederek proje başına önemli tasarruf sağlar."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              metric="Maliyet %40 düşüş"
            />
            <FeatureCard
              title="Kat Planı Revizyonu"
              description="Kat planlarını sürükle-bırak kolaylığında düzenler, istenen revizyonları hızla uygular."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
              metric="İş süresi %65 azalma"
            />
          </div>
        </div>
      </section>
      
      {/* Comparison Section */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Neden ArchiFrost?</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Rakip çözümlerle karşılaştırdığınızda, ArchiFrost'un farkını göreceksiniz.
            </p>
          </div>
          
          <ComparisonTable />
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Kullanıcılarımız Ne Diyor?</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Bugüne kadar yüzlerce mimar ve inşaat profesyoneli ArchiFrost ile çalıştı. İşte geri dönüşleri:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial
              quote="İmar analizi ve çizim sürecimiz ArchiFrost ile %70 hızlandı. Artık daha fazla projeye odaklanabiliyoruz."
              author="Ayşe Yılmaz"
              role="Baş Mimar"
              company="YZ Mimarlık"
            />
            <Testimonial
              quote="Revizyon sürecinde yaşanan karmaşayı tamamen ortadan kaldırdı. İş akışımız inanılmaz şekilde optimize oldu."
              author="Mehmet Kaya"
              role="Proje Müdürü"
              company="Kaya İnşaat"
            />
            <Testimonial
              quote="Yerel mevzuata uyumsuzluk nedeniyle yaşadığımız sorunlar neredeyse sıfıra indi. Büyük maliyet tasarrufu sağladık."
              author="Deniz Acar"
              role="İnşaat Mühendisi"
              company="Acar Proje"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Mimari Projelerinizi Dönüştürmeye Hazır mısınız?</h2>
          <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
            Yapay zekâ destekli mimari çözümler ile zaman ve maliyetten tasarruf edin.
          </p>
          <div className="mt-10">
            <Link href="/options">
              <Button size="lg" className="px-8 py-6 text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                Hemen Başlayın
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}