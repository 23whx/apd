import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRESET_AVATARS } from '../lib/types';
import { User as UserIcon, Mail, Calendar, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SkeletonStats } from '../components/Skeleton';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Activity stats
  const [worksSubmitted, setWorksSubmitted] = useState(0);
  const [votesCast, setVotesCast] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchProfile();
    fetchActivityStats();
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

  const fetchActivityStats = async () => {
    if (!user) return;

    try {
      // 获取提交的作品数量
      const { count: worksCount } = await supabase
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // 获取投票数量
      const { count: votesCount } = await supabase
        .from('personality_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 获取评论数量
      const { count: commentsCountData } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      setWorksSubmitted(worksCount || 0);
      setVotesCast(votesCount || 0);
      setCommentsCount(commentsCountData || 0);
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProfilePage] handleSave called');
    console.log('[ProfilePage] Current values:', { username, displayName, avatarId });
    
    setLoading(true);
    setMessage('');

    try {
      console.log('[ProfilePage] Updating user profile...');
      const { error, data } = await supabase
        .from('users')
        .update({
          username,
          display_name: displayName,
          avatar_id: avatarId
        })
        .eq('id', user!.id)
        .select();

      if (error) {
        console.error('[ProfilePage] Update error:', error);
        throw error;
      }

      console.log('[ProfilePage] Update successful', data);
      
      // 显示成功弹框
      setShowSuccessModal(true);
      console.log('[ProfilePage] Success modal shown');

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
        console.log('[ProfilePage] Profile-updated event dispatched');
      } catch {
        // 在某些环境下 window 可能不可用，忽略即可
      }

    } catch (error: any) {
      console.error('[ProfilePage] Save failed:', error);
      setMessage(`❌ ${t('common.error') || '错误'}: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('[ProfilePage] handleSave completed');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">{t('profile.title') || 'Profile Settings'}</h1>

      <div className="bg-eva-surface border border-white/10 rounded-xl p-8">
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded text-sm ${
              message.includes('Error') || message.includes('error')
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
              {t('profile.email') || 'Email'}
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
              {t('profile.username') || 'Username'}
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
              {t('profile.displayName') || 'Display Name'}
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
              {t('profile.chooseAvatar') || 'Choose Avatar (Preset)'}
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {PRESET_AVATARS.map((id) => {
                const paddedId = id.toString().padStart(2, '0');
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAvatarId(id)}
                    className={`aspect-square rounded-lg overflow-hidden transition-all border-2 ${
                      avatarId === id
                        ? 'border-eva-secondary ring-2 ring-eva-secondary'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={`/userAvatar/${paddedId}-${
                        ['御坂美琴', '夏娜', '立华奏', '亚丝娜', '雪之下雪乃', 
                         '灰原哀', '时崎狂三', '秋山澪', '波奇', '千早爱音',
                         '四宫辉夜', '樱岛麻衣', '黑岩射手', '初音未来', '牧濑红莉栖',
                         '蕾姆', 'Saber', 'CC', '小圆', '春日野穹'][id - 1]
                      }.png`}
                      alt={`Avatar ${id}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('profile.selectedAvatar') || 'Selected Avatar'}: <span className="text-eva-secondary font-bold">{avatarId}</span>
            </p>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('profile.memberSince') || 'Member Since'}
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
            {loading ? (t('profile.saving') || 'Saving...') : (
              <>
                <Save className="w-5 h-5" />
                {t('profile.saveChanges') || 'Save Changes'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* My Activity */}
      <div className="mt-8 bg-eva-surface border border-white/10 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">{t('profile.myActivity') || 'My Activity'}</h2>
        {loadingStats ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-eva-secondary mb-1">{worksSubmitted}</div>
              <div className="text-sm text-gray-400">{t('profile.worksSubmitted') || 'Works Submitted'}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-eva-accent mb-1">{votesCast}</div>
              <div className="text-sm text-gray-400">{t('profile.votesCast') || 'Votes Cast'}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{commentsCount}</div>
              <div className="text-sm text-gray-400">{t('profile.comments') || 'Comments'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-eva-surface border border-eva-secondary/50 rounded-xl max-w-md w-full p-8 relative shadow-2xl animate-scaleIn">
            {/* 成功图标 */}
            <div className="w-16 h-16 bg-eva-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-eva-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* 标题 */}
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {t('profile.updateSuccess') || '修改成功'}
            </h3>
            
            {/* 描述 */}
            <p className="text-gray-400 text-center mb-6">
              {t('profile.updateSuccessDesc') || '您的个人资料已成功更新！'}
            </p>
            
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors"
            >
              {t('common.confirm') || '确定'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

