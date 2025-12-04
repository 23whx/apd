import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, X, AlertCircle, CheckCircle, Image as ImageIcon, Trash2 } from 'lucide-react';

interface Character {
  id: string;
  name_cn: string;
  name_en: string;
  name_jp: string;
  avatar_url: string;
}

export const SubmitWorkPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 作品信息
  const [nameCn, setNameCn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [workType, setWorkType] = useState<'anime' | 'manga' | 'game' | 'novel'>('anime');
  const [summary, setSummary] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  
  // 角色列表
  const [characters, setCharacters] = useState<Character[]>([]);
  
  // 状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdWorkId, setCreatedWorkId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
    // 如果从搜索页面跳转过来，预填充作品名
    if (location.state?.workName) {
      setNameCn(location.state.workName);
    }
  }, [user, navigate, location]);

  const addCharacter = () => {
    setCharacters([
      ...characters,
      {
        id: Date.now().toString(),
        name_cn: '',
        name_en: '',
        name_jp: '',
        avatar_url: ''
      }
    ]);
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter((c) => c.id !== id));
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setCharacters(
      characters.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameCn.trim()) {
      setError('Work name (Chinese) is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 创建作品
      const { data: newWork, error: workError } = await supabase
        .from('works')
        .insert([
          {
            name_cn: nameCn.trim(),
            name_en: nameEn.trim() || null,
            name_jp: nameJp.trim() || null,
            type: workType,
            summary_md: summary.trim() || null,
            cover_url: coverUrl.trim() || null,
            created_by: user!.id
          }
        ])
        .select()
        .single();

      if (workError) throw workError;

      // 2. 创建角色（如果有）
      if (characters.length > 0) {
        const validCharacters = characters.filter((c) => c.name_cn.trim());
        
        if (validCharacters.length > 0) {
          const charactersToInsert = validCharacters.map((char) => ({
            work_id: newWork.id,
            name_cn: char.name_cn.trim(),
            name_en: char.name_en.trim() || null,
            name_jp: char.name_jp.trim() || null,
            avatar_url: char.avatar_url.trim() || null
          }));

          const { error: charError } = await supabase
            .from('characters')
            .insert(charactersToInsert);

          if (charError) {
            console.error('Error inserting characters:', charError);
            // 不抛出错误，允许作品创建成功但角色创建失败
          }
        }
      }

      setCreatedWorkId(newWork.id);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (success && createdWorkId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-eva-surface border border-white/10 rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Work Submitted Successfully!</h2>
          <p className="text-gray-400 mb-6">
            Your work has been added to the database.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(`/works/${createdWorkId}`)}
              className="bg-eva-secondary text-eva-bg font-bold px-6 py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors"
            >
              View Work Page
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/5 border border-white/10 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-2">Submit New Work</h1>
      <p className="text-gray-400 mb-8">
        Add an ACGN work and its characters to the database. All fields are manually filled.
      </p>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 作品基本信息 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Work Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Chinese Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nameCn}
                onChange={(e) => setNameCn(e.target.value)}
                placeholder="e.g., 进击的巨人"
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
                  placeholder="e.g., Attack on Titan"
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
                  placeholder="e.g., 進撃の巨人"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Work Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['anime', 'manga', 'game', 'novel'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWorkType(type)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      workType === type
                        ? 'bg-eva-secondary text-eva-bg'
                        : 'bg-black/30 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Cover Image URL
              </label>
              <div className="flex gap-2">
                <ImageIcon className="w-10 h-10 text-gray-500 flex-shrink-0" />
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Paste an image URL from Imgur, Wikipedia, or other image hosting services
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Summary / Description
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A brief summary of the work..."
                rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
              />
            </div>
          </div>
        </div>

        {/* 角色列表 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Characters</h2>
            <button
              type="button"
              onClick={addCharacter}
              className="bg-eva-accent text-white px-4 py-2 rounded-lg hover:bg-eva-accent/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Character
            </button>
          </div>

          {characters.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No characters added yet. Click "Add Character" to start.
            </p>
          ) : (
            <div className="space-y-4">
              {characters.map((char, index) => (
                <div
                  key={char.id}
                  className="bg-black/20 border border-white/5 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg">Character #{index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeCharacter(char.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-400">
                        Chinese Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={char.name_cn}
                        onChange={(e) =>
                          updateCharacter(char.id, 'name_cn', e.target.value)
                        }
                        placeholder="e.g., 艾伦"
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-eva-secondary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-400">
                        English Name
                      </label>
                      <input
                        type="text"
                        value={char.name_en}
                        onChange={(e) =>
                          updateCharacter(char.id, 'name_en', e.target.value)
                        }
                        placeholder="e.g., Eren"
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-eva-secondary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-400">
                        Japanese Name
                      </label>
                      <input
                        type="text"
                        value={char.name_jp}
                        onChange={(e) =>
                          updateCharacter(char.id, 'name_jp', e.target.value)
                        }
                        placeholder="e.g., エレン"
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-eva-secondary"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Avatar Image URL
                    </label>
                    <input
                      type="url"
                      value={char.avatar_url}
                      onChange={(e) =>
                        updateCharacter(char.id, 'avatar_url', e.target.value)
                      }
                      placeholder="https://example.com/character.jpg"
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-eva-secondary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !nameCn.trim()}
            className="flex-1 bg-eva-secondary text-eva-bg font-bold py-4 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-eva-bg"></div>
                Submitting...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Submit Work
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
