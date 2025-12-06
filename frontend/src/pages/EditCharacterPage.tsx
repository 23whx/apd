import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export const EditCharacterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  // 角色信息
  const [nameCn, setNameCn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [workName, setWorkName] = useState('');

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
      fetchCharacter();
    }
  }, [id, user, authLoading]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin' || data?.role === 'mod');
  };

  const fetchCharacter = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: characterData, error: characterError } = await supabase
        .from('characters')
        .select(`
          *,
          works (name_cn)
        `)
        .eq('id', id)
        .single();

      if (characterError) throw characterError;

      setNameCn(characterData.name_cn || '');
      setNameEn(characterData.name_en || '');
      setNameJp(characterData.name_jp || '');

      const existingAvatar: string | null = characterData.avatar_url || null;
      // 如果是百度 / 花瓣等容易防盗链的域名，则在编辑页中不再预填，避免误以为是可用链接
      if (
        existingAvatar &&
        (existingAvatar.includes('pics.baidu.com') ||
          existingAvatar.includes('pics0.baidu.com') ||
          existingAvatar.includes('pics1.baidu.com') ||
          existingAvatar.includes('pics2.baidu.com') ||
          existingAvatar.includes('pics3.baidu.com') ||
          existingAvatar.includes('huaban.com'))
      ) {
        setAvatarUrl('');
      } else {
        setAvatarUrl(existingAvatar || '');
      }
      setWorkName(characterData.works?.name_cn || '');
    } catch (error: any) {
      setError(error.message || 'Failed to load character');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nameCn.trim()) {
      setError('角色中文名不能为空');
      return;
    }

    setSaving(true);
    setError('');

    try {
      console.log('[EditCharacter] 准备保存，当前 avatarUrl:', avatarUrl);
      console.log('[EditCharacter] 角色 ID:', id);

      const updateData = {
        name_cn: nameCn.trim(),
        name_en: nameEn.trim() || null,
        name_jp: nameJp.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };

      console.log('[EditCharacter] 更新数据:', updateData);

      const { data, error: updateError } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', id)
        .select(); // 加上 select() 返回更新后的数据

      console.log('[EditCharacter] Supabase 返回 data:', data);
      console.log('[EditCharacter] Supabase 返回 error:', updateError);

      if (updateError) {
        console.error('[EditCharacter] 更新失败:', updateError);
        throw updateError;
      }

      if (!data || data.length === 0) {
        throw new Error('更新失败：没有找到对应的角色记录，可能是权限不足或记录不存在');
      }

      console.log('[EditCharacter] 保存成功，更新后的数据:', data[0]);
      alert('保存成功！');
      navigate(`/characters/${id}`);
    } catch (err: any) {
      console.error('[EditCharacter] 保存出错:', err);
      const errorMsg = err.message || '保存失败';
      setError(errorMsg);
      alert(`保存失败：${errorMsg}`); // 同时弹出提示
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">权限不足</h1>
        <p className="text-gray-400">只有管理员可以编辑角色</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(`/characters/${id}`)}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回角色页面
      </button>

      <h1 className="text-4xl font-bold mb-2">编辑角色</h1>
      <p className="text-gray-400 mb-8">
        所属作品: <span className="text-eva-secondary">{workName}</span>
      </p>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Chinese Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nameCn}
              onChange={(e) => setNameCn(e.target.value)}
              placeholder="e.g., 艾伦·耶格尔"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                English Name
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g., Eren Yeager"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Japanese Name
              </label>
              <input
                type="text"
                value={nameJp}
                onChange={(e) => setNameJp(e.target.value)}
                placeholder="e.g., エレン・イェーガー"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Character Image URL
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Use Imgur or Wikimedia Commons (avoid Baidu, Huaban due to hotlink protection)
            </p>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://i.imgur.com/example.jpg"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
            />
            {avatarUrl && (
              <div className="mt-4 flex justify-center">
                <img
                  src={avatarUrl}
                  alt="Character Preview"
                  className="max-h-48 w-auto object-contain rounded-lg border border-white/10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-eva-bg border-t-transparent rounded-full animate-spin"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                保存修改
              </>
            )}
          </button>
          <button
            onClick={() => navigate(`/characters/${id}`)}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

