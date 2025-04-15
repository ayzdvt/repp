import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CADPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Örnek şablonu yükle
  const loadSampleDrawing = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      // Örnek şablonu localStorage'a kaydet
      localStorage.setItem('sampleCADDrawing', JSON.stringify({
        name: 'Örnek AutoCAD Çizimi',
        type: 'sample'
      }));
      
      setTimeout(() => {
        setSuccess('Örnek çizim başarıyla yüklendi');
        // Kısa bir süre sonra çizim sayfasına yönlendir
        setTimeout(() => {
          setLocation('/drawing');
        }, 1000);
      }, 1500);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      
      // Dosya tipi kontrolü
      const validTypes = ['.dwg', '.dxf', 'application/acad', 'application/dxf', 'application/dwg'];
      const invalidFiles = newFiles.filter(file => {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        return !validTypes.includes(file.type) && !validTypes.includes(`.${fileExt}`);
      });
      
      if (invalidFiles.length > 0) {
        setError('Desteklenmeyen dosya formatı. Lütfen DWG veya DXF dosyaları yükleyin.');
        return;
      }
      
      // Dosya boyutu kontrolü (20MB limit)
      const oversizedFiles = newFiles.filter(file => file.size > 20 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError('Dosya boyutu çok büyük. 20MB\'dan küçük dosyalar yükleyin.');
        return;
      }
      
      setFiles([...newFiles]);
    }
  };
  
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Lütfen en az bir dosya seçin.');
      return;
    }
    
    setError(null);
    setSuccess(null);
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
  
  // Sonuç sayfasını gösterme durumu
  if (success) {
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
            
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Başarılı</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
            
            <div className="flex justify-center mt-8">
              <Button 
                onClick={() => setLocation('/drawing')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Çizim Ekranına Git
              </Button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

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
              Mevcut AutoCAD çiziminizi yükleyin veya örnek bir çizim kullanın
            </p>
            
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              className="w-full mb-6 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
              onClick={loadSampleDrawing}
              disabled={isLoading || isUploading || isProcessing}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Yükleniyor...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Örnek Çizimi Kullan
                </>
              )}
            </Button>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ya da çizim dosyanızı yükleyin</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".dwg,.dxf"
                  multiple
                  disabled={isUploading || isProcessing}
                />
                
                <div className="space-y-4">
                  <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
              
              {/* Yüklenen dosyaları göster */}
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Dosyalar ({files.length})</p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-50 p-2 rounded flex items-center justify-between"
                      >
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
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          disabled={isUploading || isProcessing}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Yükleniyor...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              {isProcessing && (
                <div className="flex items-center justify-center space-x-3 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-lg text-gray-800">Çizim işleniyor...</span>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={files.length === 0 || isUploading || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? 'Yükleniyor...' : isProcessing ? 'İşleniyor...' : 'Çizimi Aç'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}