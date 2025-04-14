import { GoogleGenerativeAI } from '@google/generative-ai';

// API anahtarı
const API_KEY = 'AIzaSyBfggEevPVGc6z_2sVT3Cs5-GwVC2OTqUg';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ProjectDetails {
  city?: string;
  district?: string;
  neighborhood?: string;
  block?: string;
  parcel?: string;
  land_area?: number;
  owner?: string;
  sheet_no?: string;
  floor_count?: string;
  front_setback?: number;
  side_setback?: number;
  rear_setback?: number;
  roof_type?: string;
  roof_angle?: number;
  building_order?: string;
  plan_position?: string;
  ground_coverage_ratio?: number;
  floor_area_ratio?: number;
  parcel_coordinates?: Array<{No?: number, x: number, y: number}>;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Gelişmiş rate limit yönetimi için token bucket implementasyonu
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(capacity: number, refillRatePerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.refillRate = refillRatePerSecond / 1000; // Convert to tokens per millisecond
  }

  async getToken(): Promise<void> {
    this.refill();
    if (this.tokens < 1) {
      const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }
    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const newTokens = timePassed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// Global token bucket instance - 60 requests per minute
const rateLimiter = new TokenBucket(60, 60);

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000,
  maxDelay = 32000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Rate limit kontrolü
      await rateLimiter.getToken();
      
      return await operation();
    } catch (err) {
      const error = err as Error;
      lastError = error;
      
      // Eğer son deneme ise, hatayı fırlat
      if (attempt === maxRetries) {
        throw new Error(`Maximum retry attempts reached. Last error: ${error.message}`);
      }

      // Rate limit veya quota hatası kontrolü
      const isRateLimitError = error.message.includes('429') || 
                              error.message.includes('quota') ||
                              error.message.includes('Resource has been exhausted');

      if (!isRateLimitError) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(Math.pow(2, attempt) * baseDelay + Math.random() * 1000, maxDelay);
      console.warn(`API rate limit aşıldı. ${delay}ms bekleyip tekrar deneniyor... (${attempt + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Unknown error occurred during retry');
}

/**
 * Tekli dosya analiziyi yapan fonksiyon
 */
export async function analyzeDocument(file: File): Promise<ProjectDetails> {
  try {
    // Input validation
    if (!file) {
      throw new Error('Lütfen bir dosya seçin');
    }

    if (file.size === 0) {
      throw new Error('Dosya boş');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
    }

    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!supportedTypes.includes(file.type)) {
      throw new Error('Desteklenmeyen dosya formatı. Lütfen PDF veya görsel dosyası yükleyin');
    }

    const bytes = await file.arrayBuffer().catch(() => {
      throw new Error('Dosya okunamadı');
    });
    
    const base64 = arrayBufferToBase64(bytes);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.2,
        topP: 0.7,
        topK: 30,
        maxOutputTokens: 1024
      }
    });

    const prompt = `Sen bir mimari proje belgelerini analiz eden uzmansın. 
    Belge türüne göre (İnşaat İstikamet Rölevesi, İmar Durumu veya Plan Notları) aşağıdaki bilgileri çıkarman gerekiyor.
    Öncelik sırası:
    1. İnşaat İstikamet Rölevesi
    2. İmar Durumu
    3. Plan Notları
    Çıkarılacak bilgiler:
    - İl (city)
    - İlçe (district)
    - Mahalle (neighborhood)
    - Ada (block)
    - Parsel (parcel)
    - Arsa Alanı (land_area) - sayısal değer olarak m²
    - Malik/Maliki (owner)
    - Pafta No (sheet_no)
    - Kat Adedi (floor_count) 
    - Ön Bahçe Mesafesi (front_setback) - metre cinsinden sayısal değer
    - Yan Bahçe Mesafesi (side_setback) - metre cinsinden sayısal değer
    - Arka Bahçe Mesafesi (rear_setback) - metre cinsinden sayısal değer
    - Çatı Katı (roof_type) - "yapılabilir" veya "yapılamaz" şeklinde
    - Çatı Eğimi (roof_angle) - derece cinsinden sayısal değer
    - İnşaat Nizamı (building_order)
    - Planındaki Konumu (plan_position) - "Konut Alanı", "Ticaret Alanı", "Karma Kullanım Alanı" vb.
    - TAKS (ground_coverage_ratio) - ondalık sayı (örn: 0.25)
    - Emsal (floor_area_ratio) - ondalık sayı (örn: 2.07)
    - Parsel Köşe Koordinatları (parcel_coordinates) - SADECE İnşaat İstikamet Rölevesi veya Aplikasyon Krokisinde belirtilen ITRF96/TM30 (EPSG:5254) koordinatlarını al. Poligon noktalarını veya başka koordinat sistemlerindeki değerleri ALMA! Örnek format:
      [
        {"No": 5, "x": 528145.12, "y": 4532678.45},
        {"No": 9, "x": 528167.78, "y": 4532678.45},
        {"No": 15, "x": 528167.78, "y": 4532698.12},
        {"No": 17, "x": 528145.12, "y": 4532698.12}
      ]
      Koordinatlar saat yönünde veya saatin tersi yönünde sıralı olmalı.
      X koordinatı doğu-batı yönünü (Easting), Y koordinatı kuzey-güney yönünü (Northing) temsil eder.
      Koordinatlar metre cinsinden ve 2 ondalık basamak hassasiyetinde olmalı.
      ÖNEMLİ: Sadece ITRF96/TM30 koordinatlarını al, poligon noktalarını veya başka koordinat sistemlerindeki değerleri ALMA!
    Yanıtını sadece JSON formatında ver. Bulamadığın değerleri null olarak işaretle.
    Koordinatlar imar çapında veya aplikasyon krokisinde genellikle tablo halinde veya köşe noktaları olarak belirtilir.`;

    const result = await retryWithExponentialBackoff(async () => {
      try {
        // Gemini API için uyumlu istek formatını hazırla
        const parts = [
          { text: prompt },
          { 
            inlineData: {
              mimeType: file.type,
              data: base64
            }
          }
        ];

        const response = await model.generateContent(parts);

        if (!response) {
          throw new Error('Yapay zeka yanıt vermedi');
        }

        return response;
      } catch (err) {
        const error = err as Error;
        throw error;
      }
    });

    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Yapay zeka boş yanıt döndürdü');
    }

    try {
      const jsonStr = text.replace(/```json\n|\n```/g, '').trim();
      const parsedResult = JSON.parse(jsonStr);

      // Validate the result has at least some of the expected fields
      const requiredFields = ['city', 'district', 'block', 'parcel'];
      const hasAnyRequiredField = requiredFields.some(field => parsedResult[field] !== null && parsedResult[field] !== undefined);

      if (!hasAnyRequiredField) {
        throw new Error('Belgede gerekli bilgiler bulunamadı');
      }

      // Koordinatları doğrula
      if (parsedResult.parcel_coordinates) {
        if (!Array.isArray(parsedResult.parcel_coordinates)) {
          throw new Error('Parsel koordinatları geçerli bir dizi değil');
        }

        // Her koordinat noktasını doğrula
        parsedResult.parcel_coordinates = parsedResult.parcel_coordinates.map((point: any) => {
          if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            throw new Error('Geçersiz koordinat noktası');
          }
          // No değeri varsa dahil et
          if (point.No !== undefined) {
            return { No: point.No, x: point.x, y: point.y };
          }
          return { x: point.x, y: point.y };
        });
      }

      return parsedResult;
    } catch (err) {
      const error = err as Error;
      console.error('JSON ayrıştırma hatası:', error);
      throw new Error('Belge analizi başarısız oldu. Lütfen geçerli bir belge yüklediğinizden emin olun.');
    }
  } catch (err) {
    const error = err as Error;
    console.error('Analiz hatası:', error);
    throw new Error(error.message || 'Belge analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

/**
 * Çoklu dosya analizi için yeni fonksiyon
 */
export async function analyzeMultipleDocuments(files: File[]): Promise<ProjectDetails> {
  try {
    if (!files || files.length === 0) {
      throw new Error('Lütfen en az bir dosya seçin');
    }

    // Tüm sonuçları tutacak dizi
    const results: ProjectDetails[] = [];
    
    // Dosyaları sırayla analiz et
    for (const file of files) {
      try {
        const result = await analyzeDocument(file);
        results.push(result);
      } catch (err) {
        console.warn(`${file.name} dosyası analiz edilemedi, diğer dosyalara devam ediliyor:`, err);
        // Hata durumunda bile devam et
      }
    }

    if (results.length === 0) {
      throw new Error('Yüklenen dosyalardan hiçbiri analiz edilemedi');
    }

    // Sonuçları birleştir
    const mergedResult: ProjectDetails = {};
    
    // Her bir alanı kontrol et ve ilk non-null değeri al
    const fields: Array<keyof ProjectDetails> = [
      'city', 'district', 'neighborhood', 'block', 'parcel', 'land_area', 
      'owner', 'sheet_no', 'floor_count', 'front_setback', 'side_setback', 
      'rear_setback', 'roof_type', 'roof_angle', 'building_order', 
      'plan_position', 'ground_coverage_ratio', 'floor_area_ratio', 'parcel_coordinates'
    ];
    
    for (const field of fields) {
      for (const result of results) {
        if (result[field] !== undefined && result[field] !== null) {
          // @ts-ignore - tip hatasını geçici olarak görmezden gel
          mergedResult[field] = result[field];
          break; // İlk non-null değeri bulduk, sonraki sonuca geç
        }
      }
    }
    
    // Birleştirilmiş sonucun en az temel alanlardan birini içerdiğinden emin ol
    const requiredFields = ['city', 'district', 'block', 'parcel'];
    const hasAnyRequiredField = requiredFields.some(field => 
      mergedResult[field as keyof ProjectDetails] !== null && 
      mergedResult[field as keyof ProjectDetails] !== undefined
    );
    
    if (!hasAnyRequiredField) {
      throw new Error('Belgelerden gerekli bilgiler çıkarılamadı');
    }
    
    return mergedResult;
  } catch (err) {
    const error = err as Error;
    console.error('Çoklu dosya analiz hatası:', error);
    throw new Error(error.message || 'Dosyaların analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
  }
}