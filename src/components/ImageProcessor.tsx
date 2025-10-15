import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Scissors, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageProcessorProps {
  imageFile: File;
  onReset: () => void;
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({ 
  imageFile, 
  onReset 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (imageFile) {
      loadImage();
    }
  }, [imageFile]);

  const loadImage = () => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current.src = url;
      }
      drawOriginalImage(img);
    };
    
    img.src = url;
  };

  const drawOriginalImage = (img: HTMLImageElement) => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image while maintaining aspect ratio
    const maxSize = 512;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  const removeBackground = async () => {
    if (!originalCanvasRef.current || !processedCanvasRef.current) return;

    setIsLoading(true);
    setProgress(10);

    try {
      // Load the model
      const net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
      });
      
      setProgress(40);

      const canvas = originalCanvasRef.current;
      const processedCanvas = processedCanvasRef.current;
      
      // Perform segmentation
      const segmentation = await net.segmentPerson(canvas);
      
      setProgress(70);

      // Create mask and apply it
      const ctx = processedCanvas.getContext('2d');
      if (!ctx) return;

      processedCanvas.width = canvas.width;
      processedCanvas.height = canvas.height;

      // Get image data
      const originalCtx = canvas.getContext('2d');
      if (!originalCtx) return;
      
      const imageData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply mask - remove background
      for (let i = 0; i < segmentation.data.length; i++) {
        if (segmentation.data[i] === 0) { // Background pixel
          const pixelIndex = i * 4;
          data[pixelIndex + 3] = 0; // Set alpha to 0 (transparent)
        }
      }

      // Draw the processed image
      ctx.putImageData(imageData, 0, 0);
      
      setProgress(100);

      // Convert to URL for download
      const processedUrl = processedCanvas.toDataURL('image/png');
      setProcessedImageUrl(processedUrl);

      toast({
        title: "背景移除成功！",
        description: "图片背景已成功移除，可以下载了。",
      });

    } catch (error) {
      console.error('Background removal failed:', error);
      toast({
        title: "处理失败",
        description: "背景移除失败，请重试。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const downloadImage = () => {
    if (!processedImageUrl) return;

    const link = document.createElement('a');
    link.href = processedImageUrl;
    link.download = `removed-bg-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Original Image */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">原始图片</h3>
        <div className="flex justify-center">
          <canvas
            ref={originalCanvasRef}
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            variant="gradient"
            size="lg"
            onClick={removeBackground}
            disabled={isLoading}
          >
            <Scissors className="h-5 w-5" />
            {isLoading ? '处理中...' : '移除背景'}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={onReset}
          >
            <RotateCcw className="h-5 w-5" />
            重新选择
          </Button>
        </div>

        {isLoading && (
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center mt-2">
              正在处理图片... {progress}%
            </p>
          </div>
        )}
      </div>

      {/* Processed Image */}
      {processedImageUrl && (
        <div className="glass-card rounded-lg p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">处理后图片</h3>
            <Button
              variant="gradient"
              onClick={downloadImage}
            >
              <Download className="h-4 w-4" />
              下载
            </Button>
          </div>
          
          <div className="flex justify-center">
            <canvas
              ref={processedCanvasRef}
              className="max-w-full h-auto rounded-lg border bg-gray-100 dark:bg-gray-800 bg-[repeating-conic-gradient(#f8f9fa_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#1f2937_0%_25%,transparent_0%_50%)]"
              style={{
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px'
              }}
            />
          </div>
        </div>
      )}

      {/* Hidden image element for loading */}
      <img ref={imageRef} className="hidden" alt="" />
    </div>
  );
};