// ES Module şeklinde import ediyoruz
// @ts-ignore
import DxfParserLib from 'dxf-parser';
import { createLine, createPoint, createPolyline, LineShape, PointShape, PolylineShape } from './drawingPrimitives';

// DXF dosyasını parse edip kendi uygulamamızın anlayacağı formata dönüştürür
export async function parseDxfFile(file: File): Promise<{
  shapes: Array<LineShape | PointShape | PolylineShape>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}> {
  try {
    // Dosya içeriğini okuyalım
    const content = await readFileAsText(file);
    
    // DXF parser'ı kullanalım
    const parser = new DxfParserLib();
    const dxf = parser.parseSync(content);
    
    console.log('DXF yapısı:', dxf);
    
    // Çizimleri işleyelim
    const shapes: Array<LineShape | PointShape | PolylineShape> = [];
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    
    // Varlıkları kendi formatımıza dönüştürelim
    if (dxf && dxf.entities && dxf.entities.length > 0) {
      for (const entity of dxf.entities) {
        // Bu entity'nin sınırlarını güncelle
        const bounds = getEntityBounds(entity);
        if (bounds) {
          minX = Math.min(minX, bounds.minX);
          minY = Math.min(minY, bounds.minY);
          maxX = Math.max(maxX, bounds.maxX);
          maxY = Math.max(maxY, bounds.maxY);
        }
        
        // Entity türüne göre şekil oluştur
        const shape = convertEntityToShape(entity);
        if (shape) {
          shapes.push(shape);
        }
      }
    }
    
    return {
      shapes,
      bounds: { minX, minY, maxX, maxY }
    };
  } catch (error) {
    console.error('DXF dosyası parse edilirken hata oluştu:', error);
    throw new Error('DXF dosyası işlenirken bir hata oluştu. Lütfen geçerli bir DXF dosyası olduğundan emin olun.');
  }
}

// Dosyayı text olarak okur
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Dosya okunamadı.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

// DXF entity'sini uygulamanın anlayacağı şekil formatına dönüştürür
function convertEntityToShape(entity: any): LineShape | PointShape | PolylineShape | null {
  switch (entity.type) {
    case 'LINE':
      return createLine(
        entity.vertices[0].x, 
        entity.vertices[0].y, 
        entity.vertices[1].x, 
        entity.vertices[1].y, 
        1
      );
      
    case 'POINT':
      return createPoint(entity.position.x, entity.position.y);
      
    case 'LWPOLYLINE':
    case 'POLYLINE':
      if (entity.vertices && entity.vertices.length > 0) {
        const points = entity.vertices.map((v: any) => ({ x: v.x, y: v.y }));
        return createPolyline(points, 1, entity.closed === true);
      }
      break;
      
    // Diğer entity tipleri için de benzer dönüşümler yapılabilir
    // CIRCLE, ARC, ELLIPSE, SPLINE gibi
      
    default:
      console.log(`Desteklenmeyen entity tipi: ${entity.type}`);
      return null;
  }
  
  return null;
}

// Entity'nin sınırlarını hesaplar
function getEntityBounds(entity: any): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let maxY = Number.MIN_VALUE;
  
  switch (entity.type) {
    case 'LINE':
      if (entity.vertices && entity.vertices.length >= 2) {
        minX = Math.min(entity.vertices[0].x, entity.vertices[1].x);
        minY = Math.min(entity.vertices[0].y, entity.vertices[1].y);
        maxX = Math.max(entity.vertices[0].x, entity.vertices[1].x);
        maxY = Math.max(entity.vertices[0].y, entity.vertices[1].y);
        return { minX, minY, maxX, maxY };
      }
      break;
      
    case 'POINT':
      if (entity.position) {
        return {
          minX: entity.position.x,
          minY: entity.position.y,
          maxX: entity.position.x,
          maxY: entity.position.y
        };
      }
      break;
      
    case 'LWPOLYLINE':
    case 'POLYLINE':
      if (entity.vertices && entity.vertices.length > 0) {
        entity.vertices.forEach((v: any) => {
          minX = Math.min(minX, v.x);
          minY = Math.min(minY, v.y);
          maxX = Math.max(maxX, v.x);
          maxY = Math.max(maxY, v.y);
        });
        return { minX, minY, maxX, maxY };
      }
      break;
      
    default:
      return null;
  }
  
  return null;
}

// DWG dosyalarını açmak için daha fazla geliştirme gerekiyor 
// (DWG formatı daha karmaşık ve JavaScript'te doğrudan işlenmesi zordur)
export async function parseDwgFile(file: File): Promise<{
  shapes: Array<LineShape | PointShape | PolylineShape>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}> {
  // DWG desteği için ek kütüphaneler ve işlemler gerekecektir
  // Şimdilik sadece bir hata fırlatıyoruz
  throw new Error('DWG dosya desteği henüz uygulanmadı. Lütfen DXF formatında bir dosya kullanın.');
}