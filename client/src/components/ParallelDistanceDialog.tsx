import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ParallelDistanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDistance: (distance: number) => void;
}

export default function ParallelDistanceDialog({
  isOpen,
  onClose,
  onApplyDistance
}: ParallelDistanceDialogProps) {
  const [distance, setDistance] = useState<string>('10');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mesafeyi doğrula
    try {
      const distanceValue = parseFloat(distance);
      
      if (isNaN(distanceValue) || distanceValue <= 0) {
        setError('Lütfen pozitif bir sayısal değer girin.');
        return;
      }
      
      // Mesafeyi uygula
      onApplyDistance(distanceValue);
      
      // Dialog'u kapat ve değerleri sıfırla
      resetAndClose();
      
    } catch (err) {
      setError('Bir hata oluştu. Lütfen değeri kontrol edin.');
    }
  };
  
  const resetAndClose = () => {
    setDistance('10');
    setError(null);
    onClose();
  };
  
  // Sayısal girişte Enter tuşunu yakalamak için
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paralel Mesafesi</DialogTitle>
          <DialogDescription>
            Seçili çizgiye paralel çizmek için mesafeyi belirtin.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="distance" className="text-right">
                Mesafe
              </Label>
              <Input
                id="distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                onKeyDown={handleKeyDown}
                className="col-span-3"
                placeholder="Paralel mesafesi"
                autoFocus
                // Input odaklandığında tüm metni seç
                onFocus={(e) => e.target.select()}
              />
            </div>
            
            {error && (
              <div className="col-span-4 text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              İptal
            </Button>
            <Button type="submit">Paralel Oluştur</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}