import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PointCoordinateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoint: (x: number, y: number) => void;
}

export default function PointCoordinateDialog({
  isOpen,
  onClose,
  onAddPoint
}: PointCoordinateDialogProps) {
  const [xCoord, setXCoord] = useState<string>('');
  const [yCoord, setYCoord] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Koordinatları doğrula
    try {
      const x = parseFloat(xCoord);
      const y = parseFloat(yCoord);
      
      if (isNaN(x) || isNaN(y)) {
        setError('Lütfen geçerli sayısal değerler girin.');
        return;
      }
      
      // Nokta ekle
      onAddPoint(x, y);
      
      // Dialog'u kapat ve değerleri sıfırla
      resetAndClose();
      
    } catch (err) {
      setError('Bir hata oluştu. Lütfen değerleri kontrol edin.');
    }
  };
  
  const resetAndClose = () => {
    setXCoord('');
    setYCoord('');
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
          <DialogTitle>Nokta Koordinatları</DialogTitle>
          <DialogDescription>
            Eklemek istediğiniz noktanın X ve Y koordinatlarını girin.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="x-coord" className="text-right">
                X Koordinatı
              </Label>
              <Input
                id="x-coord"
                value={xCoord}
                onChange={(e) => setXCoord(e.target.value)}
                onKeyDown={handleKeyDown}
                className="col-span-3"
                placeholder="X koordinatı (dikey eksen)"
                autoFocus
                // Input odaklandığında tüm metni seç
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="y-coord" className="text-right">
                Y Koordinatı
              </Label>
              <Input
                id="y-coord"
                value={yCoord}
                onChange={(e) => setYCoord(e.target.value)}
                onKeyDown={handleKeyDown}
                className="col-span-3"
                placeholder="Y koordinatı (yatay eksen)"
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
            <Button type="submit">Nokta Ekle</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}