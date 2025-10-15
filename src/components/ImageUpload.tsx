import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelect, 
  selectedImage, 
  onClear 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageSelect(imageFile);
    }
  }, [onImageSelect]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  if (selectedImage) {
    const imageUrl = URL.createObjectURL(selectedImage);
    
    return (
      <div className="relative glass-card rounded-lg p-4 animate-scale-in">
        <div className="relative">
          <img
            src={imageUrl}
            alt="Selected"
            className="w-full h-64 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground text-center">
          {selectedImage.name}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "upload-zone glass-card rounded-lg p-8 text-center cursor-pointer",
        isDragOver && "drag-over"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">上传图片</h3>
          <p className="text-muted-foreground mb-4">
            拖拽图片到这里或点击选择文件
          </p>
          
          <Button variant="gradient" size="lg">
            <ImageIcon className="h-5 w-5" />
            选择图片
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          支持 JPG, PNG, WebP 格式
        </p>
      </div>
    </div>
  );
};