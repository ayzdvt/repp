import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { analyzeDocument, ProjectDetails } from '@/lib/geminiService';
import AnalysisResult from '@/components/AnalysisResult';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Upload, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AnalysisPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectDetails | null>(null);
  const [, setLocation] = useLocation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (event.target.files && event.target.files.length > 0) {
      // FileList'i array'e çevirelim
      const newFiles = Array.from(event.target.files);
      
      // Her dosya için kontrolleri yapalım
      for (const selectedFile of newFiles) {
        // Dosya tipi kontrolü
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(selectedFile.type)) {
          setError('Desteklenmeyen dosya formatı. Lütfen PDF veya görüntü dosyası yükleyin (PDF, JPG, PNG).');
          return;
        }
        
        // Dosya boyutu kontrolü (10MB limit)
        if (selectedFile.size > 10 * 1024 * 1024) {
          setError('Dosya boyutu çok büyük. 10MB\'dan küçük dosyalar yükleyin.');
          return;
        }
      }
      
      // Tüm dosyaları files dizisine ekle
      setFiles(prev => [...prev, ...newFiles]);
      
      // İlk dosya seçilmediyse, ilk dosyayı currentFile olarak ayarla
      if (!currentFile && newFiles.length > 0) {
        setCurrentFile(newFiles[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!currentFile) {
      setError('Lütfen bir dosya seçin.');
      return;
    }

    setError(null);
    setResult(null);
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
        
        // Analiz işlemini başlat
        setTimeout(() => {
          setIsUploading(false);
          setIsAnalyzing(true);
        }, 500);
        
        try {
          const data = await analyzeDocument(currentFile);
          setResult(data);
        } catch (err) {
          const error = err as Error;
          setError(error.message || 'Dosya analizi sırasında bir hata oluştu.');
        } finally {
          setIsAnalyzing(false);
        }
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

  // Dosya seçimi ve yükleme görünümü
  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-2xl font-bold text-center mb-6">İmar Belgesi Analizi</h1>
            
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  disabled={isUploading || isAnalyzing}
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
                    PDF, JPG, PNG — Maks. 10MB
                  </p>
                </div>
              </div>
              
              {currentFile && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {currentFile.type === 'application/pdf' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {Math.round(currentFile.size / 1024)} KB
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setCurrentFile(null);
                          setFiles(files.filter(f => f !== currentFile));
                        }}
                        disabled={isUploading || isAnalyzing}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tüm dosyaları göster */}
              {files.length > 1 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Tüm Dosyalar ({files.length})</p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className={`bg-gray-50 p-2 rounded flex items-center justify-between ${file === currentFile ? 'border border-blue-500' : ''}`}
                        onClick={() => setCurrentFile(file)}
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Bu dosya şu an seçili olan dosya ise, seçimi kaldır
                            if (file === currentFile) {
                              setCurrentFile(files.length > 1 ? files.find(f => f !== file) || null : null);
                            }
                            setFiles(files.filter(f => f !== file));
                          }}
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
              
              {isAnalyzing && (
                <div className="flex items-center justify-center space-x-3 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-lg text-gray-800">Belge analiz ediliyor...</span>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!currentFile || isUploading || isAnalyzing}
                >
                  {isUploading ? 'Yükleniyor...' : isAnalyzing ? 'Analiz Ediliyor...' : 'Analiz Et'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>PDF, JPG veya PNG formatındaki İmar Durumu, İnşaat İstikamet Rölevesi veya 
              Plan Notları belgelerinizi analiz edebilirsiniz.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Analiz sonuçları görünümü
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => setResult(null)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Geri Dön</span>
          </button>
        </div>
        
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Başarılı</AlertTitle>
          <AlertDescription>İmar belgesi başarıyla analiz edildi.</AlertDescription>
        </Alert>
        
        <AnalysisResult data={result} />
      </div>
    </div>
  );
}