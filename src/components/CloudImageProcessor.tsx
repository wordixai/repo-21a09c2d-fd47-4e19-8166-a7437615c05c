import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Scissors, RotateCcw, Save, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface CloudImageProcessorProps {
  imageFile: File;
  onReset: () => void;
  user: any;
}

export const CloudImageProcessor: React.FC<CloudImageProcessorProps> = ({ 
  imageFile, 
  onReset,
  user
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [savedToCloud, setSavedToCloud] = useState(false);
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

    const maxSize = 512;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  const checkCredits = async () => {
    if (!user) return false;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (error || !profile || profile.credits < 1) {
      toast({
        title: "积分不足",
        description: "您的积分不足，无法处理图片。",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const deductCredits = async () => {
    if (!user) return;

    await supabase.rpc('update_user_credits', {
      user_uuid: user.id,
      credit_change: -1
    });

    // Record usage
    await supabase
      .from('usage_stats')
      .insert({
        user_id: user.id,
        action: 'background_removal',
        credits_used: 1
      });
  };

  const removeBackground = async () => {
    if (!originalCanvasRef.current || !processedCanvasRef.current) return;

    if (user && !(await checkCredits())) {
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      const net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
      });
      
      setProgress(40);

      const canvas = originalCanvasRef.current;
      const processedCanvas = processedCanvasRef.current;
      
      const segmentation = await net.segmentPerson(canvas);
      
      setProgress(70);

      const ctx = processedCanvas.getContext('2d');
      if (!ctx) return;

      processedCanvas.width = canvas.width;
      processedCanvas.height = canvas.height;

      const originalCtx = canvas.getContext('2d');
      if (!originalCtx) return;
      
      const imageData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < segmentation.data.length; i++) {
        if (segmentation.data[i] === 0) {
          const pixelIndex = i * 4;
          data[pixelIndex + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      setProgress(100);

      const processedUrl = processedCanvas.toDataURL('image/png');
      setProcessedImageUrl(processedUrl);

      // Deduct credits if user is logged in
      if (user) {
        await deductCredits();
      }

      toast({
        title: "背景移除成功！",
        description: user ? "图片背景已成功移除，积分已扣除。" : "图片背景已成功移除。",
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

  const saveToCloud = async () => {
    if (!processedImageUrl || !user) return;

    try {
      setIsLoading(true);

      // Convert canvas to blob
      const canvas = processedCanvasRef.current;
      if (!canvas) return;

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      // Upload original image
      const originalFileName = `${user.id}/${Date.now()}_original_${imageFile.name}`;
      const { data: originalUpload, error: originalError } = await supabase.storage
        .from('original-images')
        .upload(originalFileName, imageFile);

      if (originalError) throw originalError;

      // Upload processed image
      const processedFileName = `${user.id}/${Date.now()}_processed.png`;
      const { data: processedUpload, error: processedError } = await supabase.storage
        .from('processed-images')
        .upload(processedFileName, blob);

      if (processedError) throw processedError;

      // Get public URLs
      const { data: originalUrl } = supabase.storage
        .from('original-images')
        .getPublicUrl(originalFileName);

      const { data: processedUrl } = supabase.storage
        .from('processed-images')
        .getPublicUrl(processedFileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('processed_images')
        .insert({
          user_id: user.id,
          title: imageFile.name.split('.')[0],
          original_image_url: originalUrl.publicUrl,
          processed_image_url: processedUrl.publicUrl,
          file_size: blob.size,
        });

      if (dbError) throw dbError;

      setSavedToCloud(true);
      toast({
        title: "保存成功！",
        description: "图片已保存到云端，您可以随时访问。",
      });

    } catch (error: any) {
      console.error('Save to cloud failed:', error);
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <div className="flex gap-2">
              {user && !savedToCloud && (
                <Button
                  variant="glass"
                  onClick={saveToCloud}
                  disabled={isLoading}
                >
                  <Cloud className="h-4 w-4" />
                  保存到云端
                </Button>
              )}
              <Button
                variant="gradient"
                onClick={downloadImage}
              >
                <Download className="h-4 w-4" />
                下载
              </Button>
            </div>
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

          {savedToCloud && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Cloud className="h-4 w-4" />
                <span className="text-sm font-medium">已保存到云端</span>
              </div>
            </div>
          )}
        </div>
      )}

      <img ref={imageRef} className="hidden" alt="" />
    </div>
  );
};