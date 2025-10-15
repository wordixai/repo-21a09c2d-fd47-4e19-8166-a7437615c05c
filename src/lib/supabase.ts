import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface ProcessedImage {
  id: string;
  user_id: string;
  title: string;
  original_image_url: string;
  processed_image_url: string;
  file_size: number | null;
  processing_time: number | null;
  created_at: string;
}

export interface UsageStat {
  id: string;
  user_id: string;
  action: string;
  credits_used: number;
  created_at: string;
}