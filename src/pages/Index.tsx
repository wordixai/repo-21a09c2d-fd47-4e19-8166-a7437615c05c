import React, { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageProcessor } from '@/components/ImageProcessor';
import { Scissors, Sparkles, Zap } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const handleClear = () => {
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">
              AI 背景移除工具
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            使用先进的AI技术，一键移除图片背景。支持人像、物品等多种场景。
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
          <div className="glass-card rounded-lg p-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">快速处理</h3>
            <p className="text-sm text-muted-foreground">
              AI智能识别，秒级完成背景移除
            </p>
          </div>
          
          <div className="glass-card rounded-lg p-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">高质量结果</h3>
            <p className="text-sm text-muted-foreground">
              精确边缘检测，保持细节完整
            </p>
          </div>
          
          <div className="glass-card rounded-lg p-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">免费使用</h3>
            <p className="text-sm text-muted-foreground">
              完全免费，本地处理，保护隐私
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="animate-fade-in">
          {!selectedImage ? (
            <ImageUpload
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onClear={handleClear}
            />
          ) : (
            <ImageProcessor
              imageFile={selectedImage}
              onReset={handleClear}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            由 TensorFlow.js 和 BodyPix 模型驱动 • 完全在浏览器中运行
          </p>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export default Index;