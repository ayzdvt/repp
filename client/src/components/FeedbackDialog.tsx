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
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackDialog({
  isOpen,
  onClose,
}: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

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

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen geribildirim alanını doldurun.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Veritabanına geribildirim gönder
      await apiRequest(
        'POST',
        '/api/feedbacks',
        {
          message: feedback,
          // Gerçek bir uygulamada kullanıcı ID'si de eklenebilir
          // userId: currentUser.id,
        }
      );
      
      toast({
        title: "Başarılı",
        description: "Geribildiriminiz için teşekkürler! En kısa sürede değerlendireceğiz.",
      });
      
      onClose();
    } catch (error) {
      console.error('Geribildirim gönderirken hata oluştu:', error);
      toast({
        title: "Hata",
        description: "Geribildirim gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}