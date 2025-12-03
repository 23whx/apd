import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Successfully authenticated, redirect to home
        navigate('/', { replace: true });
      } else {
        // No session, redirect to home with error
        navigate('/?error=auth_failed', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-eva-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-eva-secondary animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

