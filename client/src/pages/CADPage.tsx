import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, ArrowLeft, Upload, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CADPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [, setLocation] = useLocation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      
      // Dosya tipi kontrolü
      const validTypes = ['.dwg', '.dxf', 'application/acad', 'application/dxf', 'application/dwg'];
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      
      if (!validTypes.includes(selectedFile.type) && !validTypes.includes(`.${fileExt}`)) {
        setError('Desteklenmeyen dosya formatı. Lütfen DWG veya DXF dosyası yükleyin.');
        return;
      }
      
      // Dosya boyutu kontrolü (20MB limit)
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('Dosya boyutu çok büyük. 20MB\'dan küçük dosyalar yükleyin.');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Lütfen bir dosya seçin.');
      return;
    }

    setError(null);
    setIsUploading(true);
    
    // Simüle edilmiş yükleme ilerlemesi
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 150);

    try {
      setTimeout(async () => {
        clearInterval(interval);
        setUploadProgress(100);
        
        // İşleme başlat
        setTimeout(() => {
          setIsUploading(false);
          setIsProcessing(true);
          
          // İşleme tamamlandığında
          setTimeout(() => {
            setIsProcessing(false);
            // Çizim ekranına yönlendir
            setLocation('/drawing');
          }, 2000);
        }, 500);
      }, 1500);
    } catch (err) {
      clearInterval(interval);
      const error = err as Error;
      setError(error.message || 'Dosya yükleme sırasında bir hata oluştu.');
      setIsUploading(false);
    }
  };

  const handleReturn = () => {
    setLocation('/options');
  };

  const handleUseSampleDrawing = () => {
    setIsProcessing(true);
    
    // Örnek şablonu kullanarak çizim sayfasına yönlendir
    setTimeout(() => {
      // localStorage'a örnek çizim verilerini kaydet
      localStorage.setItem('sampleCADDrawing', JSON.stringify({
        name: 'Örnek AutoCAD Çizimi',
        type: 'sample'
      }));
      
      setIsProcessing(false);
      // Çizim sayfasına yönlendir
      setLocation('/drawing');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="app" />
      
      <div className="flex-grow bg-gradient-to-b from-gray-50 to-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button 
              onClick={handleReturn}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Geri Dön</span>
            </button>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-2">AutoCAD Çizimi</h1>
            <p className="text-center text-gray-600 mb-6">
              AutoCAD çiziminizle çalışmak için bir seçenek belirleyin
            </p>
            
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Tabs
              defaultValue="upload"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="upload" disabled={isUploading || isProcessing}>
                  <Upload className="w-4 h-4 mr-2" />
                  Dosya Yükle
                </TabsTrigger>
                <TabsTrigger value="sample" disabled={isUploading || isProcessing}>
                  <FileText className="w-4 h-4 mr-2" />
                  Örnek Çizim Kullan
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-0">
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".dwg,.dxf"
                      disabled={isUploading || isProcessing}
                    />
                    
                    <div className="space-y-4">
                      <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-blue-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      
                      <div>
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer text-blue-600 hover:text-blue-700"
                        >
                          <span className="font-medium">Dosya seçmek için tıklayın</span>
                          <span className="text-gray-500"> veya sürükleyip bırakın</span>
                        </label>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        DWG, DXF — Maks. 20MB
                      </p>
                    </div>
                  </div>
                  
                  {/* Yüklenen dosyayı göster */}
                  {file && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Seçilen Dosya</p>
                      <div className="bg-gray-50 p-3 rounded flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFile(null)}
                          disabled={isUploading || isProcessing}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={!file || isUploading || isProcessing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? 'Yükleniyor...' : 'Çizimi Aç'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sample" className="mt-0">
                <div className="space-y-6">
                  <div className="border-2 border-gray-200 rounded-lg p-8">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900">Örnek AutoCAD Çizimi</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Uygulamamızı test etmek için hazırlanmış örnek bir AutoCAD çizimini kullanabilirsiniz.
                        </p>
                      </div>
                      
                      <Button
                        onClick={handleUseSampleDrawing}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Örnek Çizimi Kullan
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {isUploading && (
              <div className="space-y-2 mt-6">
                <div className="flex justify-between text-sm">
                  <span>Yükleniyor...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center space-x-3 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-800">Çizim işleniyor...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}