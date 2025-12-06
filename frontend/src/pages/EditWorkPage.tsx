import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle, ArrowLeft, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

interface Character {
  id: string;
  name_cn: string;
  name_en: string;
  name_jp: string;
  avatar_url: string;
}

export const EditWorkPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  // 作品信息
  const [nameCn, setNameCn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [aliases, setAliases] = useState<string[]>(['']);
  const [workTypes, setWorkTypes] = useState<('anime' | 'manga' | 'game' | 'novel')[]>(['anime']);
  const [posterUrl, setPosterUrl] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
      fetchWork();
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

  const fetchWork = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // 获取作品信息
      const { data: workData, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', id)
        .single();

      if (workError) throw workError;

      setNameCn(workData.name_cn || '');
      setNameEn(workData.name_en || '');
      setNameJp(workData.name_jp || '');
      setAliases(workData.alias || ['']);
      setWorkTypes(Array.isArray(workData.type) ? workData.type : [workData.type]);
      setPosterUrl(workData.poster_url || '');
      setSummary(workData.summary_md || '');
    } catch (error: any) {
      setError(error.message || 'Failed to load work');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkType = (type: 'anime' | 'manga' | 'game' | 'novel') => {
    if (workTypes.includes(type)) {
      if (workTypes.length > 1) {
        setWorkTypes(workTypes.filter(t => t !== type));
      }
    } else {
      setWorkTypes([...workTypes, type]);
    }
  };

  const addAlias = () => {
    setAliases([...aliases, '']);
  };

  const removeAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  const updateAlias = (index: number, value: string) => {
    const newAliases = [...aliases];
    newAliases[index] = value;
    setAliases(newAliases);
  };

  const handleSave = async () => {
    if (!nameCn.trim()) {
      setError('作品中文名不能为空');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const validAliases = aliases.filter(a => a.trim() !== '');

      const { error: updateError } = await supabase
        .from('works')
        .update({
          name_cn: nameCn.trim(),
          name_en: nameEn.trim() || null,
          name_jp: nameJp.trim() || null,
          alias: validAliases.length > 0 ? validAliases : null,
          type: workTypes,
          poster_url: posterUrl.trim() || null,
          summary_md: summary.trim() || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      alert('保存成功！');
      navigate(`/works/${id}`);
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">权限不足</h1>
        <p className="text-gray-400">只有管理员可以编辑作品</p>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(`/works/${id}`)}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回作品页面
      </button>

      <h1 className="text-4xl font-bold mb-2">编辑作品</h1>
      <p className="text-gray-400 mb-8">修改作品信息</p>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* 作品信息 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">作品信息</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Chinese Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nameCn}
                onChange={(e) => setNameCn(e.target.value)}
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
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
                />
              </div>
            </div>

            {/* Aliases */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Aliases / Other Names (Optional)
              </label>
              <div className="space-y-2">
                {aliases.map((alias, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => updateAlias(index, e.target.value)}
                      placeholder={`Alias ${index + 1}`}
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
                    />
                    {aliases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAlias(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAlias}
                  className="w-full bg-white/5 text-gray-300 font-medium py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10"
                >
                  <Plus className="w-4 h-4" /> Add Alias
                </button>
              </div>
            </div>

            {/* Work Type */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Work Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['anime', 'manga', 'game', 'novel'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleWorkType(type)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      workTypes.includes(type)
                        ? 'bg-eva-secondary text-eva-bg'
                        : 'bg-black/30 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Poster */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Poster / Cover Image URL
              </label>
              <div className="flex gap-2">
                <ImageIcon className="w-10 h-10 text-gray-500 flex-shrink-0" />
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://example.com/poster.jpg"
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
                />
              </div>
              {posterUrl && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={posterUrl}
                    alt="Poster Preview"
                    className="max-h-64 w-auto object-contain rounded-lg border border-white/10"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Summary / Description
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={5}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
              ></textarea>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex gap-4">
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
            onClick={() => navigate(`/works/${id}`)}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

