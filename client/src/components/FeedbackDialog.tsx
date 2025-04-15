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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackDialog({
  isOpen,
  onClose,
}: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState<string>('');

  // Dialog açıldığında değeri sıfırla
  useEffect(() => {
    if (isOpen) {
      setFeedback('');
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

  const handleSubmit = () => {
    if (feedback.trim()) {
      // Geribildirim gönderme işlemi (gerçek bir sistemde backend'e gönderilir)
      console.log('Kullanıcı geribildirimi:', feedback);
      alert('Geribildiriminiz için teşekkürler! En kısa sürede değerlendireceğiz.');
      onClose();
    } else {
      alert('Lütfen geribildirim alanını doldurun.');
    }
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Geribildirim Gönder</DialogTitle>
          <DialogDescription>
            Uygulama hakkındaki görüş, öneri veya hatalarınızı bizimle paylaşın.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="feedback" className="text-right mt-2">
              Mesajınız
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={handleFeedbackChange}
              className="col-span-3"
              rows={5}
              placeholder="Görüş, öneri veya hata bildiriminizi buraya yazabilirsiniz..."
              autoFocus
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSubmit}>
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}