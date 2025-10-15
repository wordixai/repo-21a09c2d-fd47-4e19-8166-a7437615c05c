import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, type Profile } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, CreditCard, Image as ImageIcon } from 'lucide-react';
import { AuthModal } from './auth/AuthModal';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id);
          getImageCount(session.user.id);
        } else {
          setProfile(null);
          setImageCount(0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      getProfile(user.id);
      getImageCount(user.id);
    }
  };

  const getProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };

  const getImageCount = async (userId: string) => {
    const { count, error } = await supabase
      .from('processed_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching image count:', error);
    } else {
      setImageCount(count || 0);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "登出失败",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "已登出",
        description: "您已成功登出",
      });
    }
  };

  if (!user) {
    return (
      <>
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>登录享受云端服务</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              登录后可保存处理记录，云端存储图片，随时随地访问
            </p>
            <Button 
              variant="gradient" 
              onClick={() => setAuthModalOpen(true)}
              className="w-full"
            >
              登录 / 注册
            </Button>
          </CardContent>
        </Card>
        
        <AuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen} 
        />
      </>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {profile?.username || user.email}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="登出"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">剩余积分</span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {profile?.credits || 0}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">处理图片</span>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {imageCount}
            </Badge>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          每次处理消耗 1 积分 • 每日登录可获得额外积分
        </div>
      </CardContent>
    </Card>
  );
};