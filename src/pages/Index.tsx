import React, { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { CloudImageProcessor } from '@/components/CloudImageProcessor';
import { UserProfile } from '@/components/UserProfile';
import { ImageGallery } from '@/components/ImageGallery';
import { Scissors, Sparkles, Zap, Cloud } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const handleClear = () => {
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">
              AI 背景移除工具
            </h1>
            {user && (
              <div className="p-3 rounded-full bg-primary/10">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            使用先进的AI技术，一键移除图片背景。{user ? '云端存储，随时访问。' : '支持人像、物品等多种场景。'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="process" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="process">处理图片</TabsTrigger>
                <TabsTrigger value="gallery">图片库</TabsTrigger>
              </TabsList>

              <TabsContent value="process" className="space-y-6">
                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
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
                      <Cloud className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">云端存储</h3>
                    <p className="text-sm text-muted-foreground">
                      登录后可保存到云端，随时访问
                    </p>
                  </div>
                </div>

                {/* Image Processing */}
                <div className="animate-fade-in">
                  {!selectedImage ? (
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      selectedImage={selectedImage}
                      onClear={handleClear}
                    />
                  ) : (
                    <CloudImageProcessor
                      imageFile={selectedImage}
                      onReset={handleClear}
                      user={user}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="gallery">
                <ImageGallery user={user} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <UserProfile />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            由 TensorFlow.js 和 BodyPix 模型驱动 • {user ? '云端存储由 Supabase 提供' : '完全在浏览器中运行'}
          </p>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export default Index;