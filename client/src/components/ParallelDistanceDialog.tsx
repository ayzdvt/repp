import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ParallelDistanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDistance: (distance: number) => void;
}

export default function ParallelDistanceDialog({
  isOpen,
  onClose,
  onApplyDistance,
}: ParallelDistanceDialogProps) {
  const [distance, setDistance] = useState<number>(10);
  const [selectedSide, setSelectedSide] = useState<'positive' | 'negative' | null>(null);

  const handleApply = () => {
    // Mesafeyi sıfır veya negatif değilse uygula
    if (distance > 0) {
      // Mesafeyi uygula ve önizleme oluştur
      onApplyDistance(distance);
    } else {
      alert('Lütfen pozitif bir değer girin.');
    }
  };

  const handlePositiveSelect = () => {
    setSelectedSide('positive');
    handleSelectParallelLine('positive');
  };

  const handleNegativeSelect = () => {
    setSelectedSide('negative');
    handleSelectParallelLine('negative');
  };

  const handleSelectParallelLine = (direction: 'positive' | 'negative') => {
    // Event'i canvas'a gönder - burada doğrudan bir yöntem çağırmak yerine
    // DrawingApp'teki onSelectParallelLine fonksiyonunu kullanıyoruz
    const event = new CustomEvent('selectParallelLine', {
      detail: { direction }
    });
    
    // Canvas container'ı bul
    const container = document.getElementById('drawing-container');
    if (container) {
      const canvas = container.querySelector('div.absolute');
      if (canvas) {
        canvas.dispatchEvent(event);
      }
    }
    
    // Diyaloğu kapat
    onClose();
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDistance(isNaN(value) ? 0 : value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Paralel Uzaklık Ayarla</DialogTitle>
          <DialogDescription>
            Paralel çizgilerin orijinal çizgiye olan uzaklığını belirleyin.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="distance" className="text-right">
              Uzaklık
            </Label>
            <Input
              id="distance"
              type="number"
              value={distance}
              onChange={handleDistanceChange}
              onKeyDown={handleKeyDown}
              className="col-span-3"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>
          
          {selectedSide === null && (
            <div className="flex justify-center space-x-4 pt-2">
              <Button onClick={handleApply}>
                Önizleme Göster
              </Button>
            </div>
          )}
          
          {selectedSide === null && distance > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button 
                onClick={handlePositiveSelect}
                variant="outline"
                className="flex flex-col"
              >
                <span>Üst/Sağ Taraf</span>
                <span className="text-xs text-gray-500">Pozitif yön</span>
              </Button>
              <Button 
                onClick={handleNegativeSelect}
                variant="outline"
                className="flex flex-col"
              >
                <span>Alt/Sol Taraf</span>
                <span className="text-xs text-gray-500">Negatif yön</span>
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}