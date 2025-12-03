import { createClient } from '@supabase/supabase-js';

// 为了避免在开发环境未配置 .env 时直接白屏，这里给出占位符默认值
// 真正上线时需要在 Supabase 项目中正确配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://example.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to handle authentication errors
export const handleAuthError = (error: any) => {
  console.error('Auth error:', error);
  return error.message || 'An authentication error occurred';
};

