import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export const SubmitCharacterPage: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [workName, setWorkName] = useState('');

  // 角色信息
  const [nameCn, setNameCn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }
    fetchWorkInfo();
  }, [user, workId, authLoading]);

  const fetchWorkInfo = async () => {
    if (!workId) return;

    try {
      const { data, error } = await supabase
        .from('works')
        .select('name_cn')
        .eq('id', workId)
        .single();

      if (error) throw error;
      setWorkName(data.name_cn);
    } catch (error) {
      console.error('Error fetching work:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameCn.trim()) {
      setError('Character Chinese Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('characters')
        .insert([{
          work_id: workId,
          name_cn: nameCn.trim(),
          name_en: nameEn.trim() || null,
          name_jp: nameJp.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        }]);

      if (insertError) throw insertError;

      alert('Character added successfully!');
      navigate(`/works/${workId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to add character');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(`/works/${workId}`)}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to work
      </button>

      <h1 className="text-4xl font-bold mb-2">Add Character</h1>
      <p className="text-gray-400 mb-8">
        Add a new character to <span className="text-eva-secondary">{workName}</span>
      </p>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-eva-surface border border-white/10 rounded-xl p-6">
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
              required
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
            type="submit"
            disabled={loading}
            className="flex-1 bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-eva-bg border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Add Character
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/works/${workId}`)}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

