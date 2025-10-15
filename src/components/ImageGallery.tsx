import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, type ProcessedImage } from '@/lib/supabase';
import { Download, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageGalleryProps {
  user: any;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ user }) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user]);

  const fetchImages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('processed_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error fetching images:', error);
      toast({
        title: "加载失败",
        description: "无法加载图片列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string, originalUrl: string, processedUrl: string) => {
    try {
      // Extract file paths from URLs
      const originalPath = originalUrl.split('/').slice(-2).join('/');
      const processedPath = processedUrl.split('/').slice(-2).join('/');

      // Delete from storage
      await supabase.storage.from('original-images').remove([originalPath]);
      await supabase.storage.from('processed-images').remove([processedPath]);

      // Delete from database
      const { error } = await supabase
        .from('processed_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.filter(img => img.id !== imageId));
      toast({
        title: "删除成功",
        description: "图片已从云端删除",
      });
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-8">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">请登录查看您的图片库</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">加载中...</p>
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            我的图片库
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">还没有处理过的图片</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          我的图片库
          <Badge variant="secondary">{images.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg p-4 space-y-3">
              <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                <img
                  src={image.processed_image_url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <h4 className="font-medium truncate">{image.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(image.created_at).toLocaleDateString('zh-CN')}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadImage(image.processed_image_url, `${image.title}.png`)}
                >
                  <Download className="h-3 w-3" />
                  下载
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteImage(image.id, image.original_image_url, image.processed_image_url)}
                >
                  <Trash2 className="h-3 w-3" />
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};