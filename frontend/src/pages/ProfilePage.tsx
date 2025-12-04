import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRESET_AVATARS } from '../lib/types';
import { User as UserIcon, Mail, Calendar, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;

      if (data) {
        setUsername(data.username || '');
        setDisplayName(data.display_name || '');
        setAvatarId(data.avatar_id || 1);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username,
          display_name: displayName,
          avatar_id: avatarId
        })
        .eq('id', user!.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');

      // 通知全局（例如 Navbar）刷新显示名称
      try {
        window.dispatchEvent(
          new CustomEvent('profile-updated', {
            detail: {
              display_name: displayName,
              username
            }
          })
        );
      } catch {
        // 在某些环境下 window 可能不可用，忽略即可
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>

      <div className="bg-eva-surface border border-white/10 rounded-xl p-8">
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded text-sm ${
              message.includes('Error')
                ? 'bg-red-500/10 border border-red-500/50 text-red-400'
                : 'bg-green-500/10 border border-green-500/50 text-green-400'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
              required
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium mb-4 text-gray-300">
              Choose Avatar (Preset)
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {PRESET_AVATARS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAvatarId(id)}
                  className={`aspect-square rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                    avatarId === id
                      ? 'bg-eva-secondary text-eva-bg ring-2 ring-eva-secondary'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Selected Avatar: <span className="text-eva-secondary font-bold">{avatarId}</span>
            </p>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Member Since
            </label>
            <input
              type="text"
              value={new Date(user.created_at).toLocaleDateString()}
              disabled
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Saving...' : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* My Activity */}
      <div className="mt-8 bg-eva-surface border border-white/10 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">My Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-eva-secondary mb-1">0</div>
            <div className="text-sm text-gray-400">Works Submitted</div>
          </div>
          <div className="bg-black/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-eva-accent mb-1">0</div>
            <div className="text-sm text-gray-400">Votes Cast</div>
          </div>
          <div className="bg-black/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">0</div>
            <div className="text-sm text-gray-400">Comments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

