import React, { useState, useEffect } from 'react';
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

  // Dialog açıldığında değeri sıfırla
  useEffect(() => {
    if (isOpen) {
      setDistance(10);
    }
  }, [isOpen]);

  // Escape tuşu kontrolü
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    // Mesafeyi sıfır veya negatif değilse uygula
    if (distance > 0) {
      // Mesafeyi uygula ve önizleme oluştur
      onApplyDistance(distance);
      // Diyaloğu kapat
      onClose();
    } else {
      alert('Lütfen pozitif bir değer girin.');
    }
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
            Paralel çizginin orijinal çizgiye olan uzaklığını belirleyin.
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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleApply}>
            Tamam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}