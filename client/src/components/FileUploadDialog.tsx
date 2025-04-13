import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  title: string;
  description: string;
  acceptedFileTypes: string;
  fileTypeDescription: string;
}

export default function FileUploadDialog({
  isOpen,
  onClose,
  onFileUpload,
  title,
  description,
  acceptedFileTypes,
  fileTypeDescription
}: FileUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onFileUpload(selectedFile);
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFile(null);
        }, 500);
      }
    }, 300);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            mt-4 border-2 border-dashed rounded-lg p-8 text-center
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            transition-colors cursor-pointer
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept={acceptedFileTypes}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Dosyanızı buraya sürükleyin veya</p>
                <Button size="sm" variant="outline" type="button" onClick={handleBrowseClick}>
                  Dosya Seçin
                </Button>
              </div>
              <p className="text-xs text-gray-500">{fileTypeDescription}</p>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Yükleniyor...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        <div className="mt-4 flex justify-end space-x-3">
          <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
            İptal
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}