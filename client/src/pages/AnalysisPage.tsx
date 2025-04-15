import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { analyzeDocument, analyzeMultipleDocuments, ProjectDetails } from '@/lib/geminiService';
import AnalysisResult from '@/components/AnalysisResult';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Upload, Plus, Database, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AnalysisPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectDetails | null>(null);
  const [, setLocation] = useLocation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Veritabanından örnek şablonu yükle
  const loadSampleAnalysis = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Veri tabanından son kaydedilen analizi al
      const response = await fetch('/api/analyses?userId=1');
      if (!response.ok) {
        throw new Error('Örnek veri yüklenirken bir hata oluştu');
      }
      
      const analyses = await response.json();
      if (analyses.length === 0) {
        throw new Error('Veri tabanında kayıtlı analiz bulunamadı');
      }
      
      // En son kaydedilen analizi al (en yüksek ID'ye sahip olan)
      const latestAnalysis = analyses.reduce((latest: any, current: any) => 
        (current.id > latest.id) ? current : latest, analyses[0]);
      
      // Koordinatları JSON objesine dönüştür
      if (latestAnalysis.parcel_coordinates && typeof latestAnalysis.parcel_coordinates === 'string') {
        latestAnalysis.parcel_coordinates = JSON.parse(latestAnalysis.parcel_coordinates);
      }
      
      setResult(latestAnalysis);
      setSuccess('Örnek veri başarıyla yüklendi');
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
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Lütfen en az bir dosya seçin.');
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
          // Birden fazla dosya varsa analyzeMultipleDocuments fonksiyonunu kullan
          // Tek dosya varsa analyzeDocument fonksiyonunu kullan
          let data;
          if (files.length > 1) {
            data = await analyzeMultipleDocuments(files);
          } else {
            data = await analyzeDocument(files[0]);
          }
          
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
  
  // Analiz sonuçlarını veritabanına kaydetme işlemi
  const saveToDatabase = async () => {
    if (!result) return;
    
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    
    try {
      // API'ya gönderilecek veriyi hazırla
      // Tüm değerleri metinsel olarak hazırla
      const projectData = {
        city: result.city || undefined,
        district: result.district || undefined,
        neighborhood: result.neighborhood || undefined,
        block: result.block ? String(result.block) : undefined,
        parcel: result.parcel ? String(result.parcel) : undefined,
        land_area: result.land_area ? String(result.land_area) : undefined,
        owner: result.owner || undefined,
        sheet_no: result.sheet_no || undefined,
        floor_count: result.floor_count ? String(result.floor_count) : undefined,
        front_setback: result.front_setback ? String(result.front_setback) : undefined,
        side_setback: result.side_setback ? String(result.side_setback) : undefined,
        rear_setback: result.rear_setback ? String(result.rear_setback) : undefined,
        roof_type: result.roof_type || undefined,
        roof_angle: result.roof_angle ? String(result.roof_angle) : undefined,
        building_order: result.building_order || undefined,
        plan_position: result.plan_position || undefined,
        ground_coverage_ratio: result.ground_coverage_ratio ? String(result.ground_coverage_ratio) : undefined,
        floor_area_ratio: result.floor_area_ratio ? String(result.floor_area_ratio) : undefined,
        parcel_coordinates: result.parcel_coordinates ? JSON.stringify(result.parcel_coordinates) : '[]',
        userId: 1 // Geçici olarak userId'yi 1 olarak ayarlıyoruz
      };
      
      try {
        const response = await fetch('/api/analyses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Sunucu hatası: ${response.status} ${errorText}`);
        }
        
        const savedData = await response.json();
        setSuccess(`Analiz sonuçları başarıyla veritabanına kaydedildi (ID: ${savedData.id})`);
      } catch (error) {
        console.error('Fetch hatası:', error);
        if (error instanceof Error) {
          throw new Error(`API isteği başarısız: ${error.message}`);
        } else {
          throw new Error('API isteği başarısız: Bilinmeyen hata');
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Veritabanına kaydetme hatası:', error);
      setError(error.message || 'Veri kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
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
            <h1 className="text-2xl font-bold text-center mb-2">İmar Belgesi Analizi</h1>
            <p className="text-center text-gray-600 mb-6">
              İmar Durumu, İnşaat İstikamet Rölevesi veya Plan Notları belgelerinizi yapay zeka ile analiz edebilirsiniz.
            </p>
            
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Örnek şablon kullanma butonu */}
            <Button
              className="w-full mb-6 bg-blue-600 hover:bg-blue-700"
              onClick={loadSampleAnalysis}
              disabled={isLoading}
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
                  Örnek Şablonu Kullan
                </>
              )}
            </Button>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ya da belgenizi yükleyin</span>
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
                            {file.type === 'application/pdf' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          disabled={isUploading || isAnalyzing}
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
                  disabled={files.length === 0 || isUploading || isAnalyzing}
                >
                  {isUploading ? 'Yükleniyor...' : isAnalyzing ? 'Analiz Ediliyor...' : 'Analiz Et'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Açıklama metnini sayfanın başlığının altına taşıdık */}
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
        
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : success ? (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Başarılı</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Başarılı</AlertTitle>
            <AlertDescription>
              {files.length > 1 
                ? `${files.length} adet imar belgesi başarıyla analiz edildi.` 
                : 'İmar belgesi başarıyla analiz edildi.'}
            </AlertDescription>
          </Alert>
        )}
        
        <AnalysisResult data={result} />
        
        <div className="flex justify-end mt-6 space-x-4">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={() => {
              if (result?.parcel_coordinates && result.parcel_coordinates.length > 0) {
                // Koordinatları localStorage'a kaydet
                localStorage.setItem('parselCoordinates', JSON.stringify(result.parcel_coordinates));
              }
              // Çizim sayfasına yönlendir
              window.location.href = '/drawing';
            }}
          >
            <span>Çizime Başla</span>
          </Button>
          
          <Button 
            onClick={saveToDatabase}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Veritabanına Kaydet</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}