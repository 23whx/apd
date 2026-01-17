import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, AlertCircle, Search, Eye, EyeOff } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  langs: Array<'zh' | 'en' | 'ja'>;
}

export const AdminBlogPage: React.FC = () => {
  const { user, loading: authLoading, isAdmin, adminChecked } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchedOnceForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      return;
    }

    if (!adminChecked) return;
    if (!isAdmin) return;

    // Dev 模式 StrictMode 可能重复触发：同一用户只拉一次列表
    if (fetchedOnceForUserRef.current === user.id) return;
    fetchedOnceForUserRef.current = user.id;
    fetchPosts();
  }, [authLoading, user?.id, adminChecked, isAdmin]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // 后台应展示所有主文章；标题优先显示中文，其次英文/日文（即使缺少中文翻译也不要“消失”）
      const { data: masters, error: masterErr } = await supabase
        .from('blog_posts')
        .select('id, slug, category, published, view_count, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (masterErr) throw masterErr;

      const ids = (masters || []).map((m: any) => m.id);
      const { data: translations, error: tErr } = await supabase
        .from('blog_post_translations')
        .select('post_id, lang, title')
        .in('post_id', ids);

      if (tErr) throw tErr;

      const titleByPostId = new Map<string, Partial<Record<'zh' | 'en' | 'ja', string>>>();
      const langsByPostId = new Map<string, Set<'zh' | 'en' | 'ja'>>();

      (translations || []).forEach((t: any) => {
        const lang = t.lang as 'zh' | 'en' | 'ja';
        if (!titleByPostId.has(t.post_id)) titleByPostId.set(t.post_id, {});
        titleByPostId.get(t.post_id)![lang] = t.title;

        if (!langsByPostId.has(t.post_id)) langsByPostId.set(t.post_id, new Set());
        langsByPostId.get(t.post_id)!.add(lang);
      });

      const langOrder: Array<'zh' | 'en' | 'ja'> = ['zh', 'en', 'ja'];

      setPosts(
        (masters || []).map((m: any) => {
          const titles = titleByPostId.get(m.id) || {};
          const langs = Array.from(
            langsByPostId.get(m.id) || new Set<'zh' | 'en' | 'ja'>()
          ).sort((a, b) => langOrder.indexOf(a) - langOrder.indexOf(b));

          const title = titles.zh || titles.en || titles.ja || '(未填写标题)';

          return {
            id: m.id,
            title,
            slug: m.slug,
            category: m.category,
            published: m.published,
            view_count: m.view_count,
            created_at: m.created_at,
            updated_at: m.updated_at,
            langs,
          } as BlogPost;
        })
      );
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string, postTitle: string) => {
    if (!confirm(`确定要删除文章「${postTitle}」吗？此操作不可撤销！`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      alert('删除成功！');
      fetchPosts();
    } catch (error: any) {
      alert('删除失败：' + error.message);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'mbti': '📊 MBTI',
      'enneagram-types': '🎭 九型类型',
      'enneagram-wings': '🪶 九型侧翼',
      'enneagram-instincts': '🧭 九型副型',
      'yixue': '☯️ 易学人格学',
      'tech': '💻 技术',
      'other': '📝 其他',
    };
    return labels[category] || category;
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <Link to="/" className="text-eva-secondary hover:underline">返回首页</Link>
      </div>
    );
  }

  if (!adminChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary mb-4"></div>
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">权限不足</h1>
        <p className="text-gray-400 mb-4">只有管理员可以访问此页面</p>
        <Link to="/" className="text-eva-secondary hover:underline">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">管理博客文章</h1>
          <p className="text-gray-400">编辑、发布或删除博客文章</p>
        </div>
        <Link
          to="/admin/blog/write"
          className="bg-eva-secondary text-eva-bg px-6 py-3 rounded-lg font-bold hover:bg-eva-secondary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          写新文章
        </Link>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章标题或 slug..."
            className="w-full bg-eva-surface border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-4">
            共 {filteredPosts.length} 篇文章
            <span className="ml-4 text-green-400">
              {posts.filter(p => p.published).length} 篇已发布
            </span>
            <span className="ml-4 text-yellow-400">
              {posts.filter(p => !p.published).length} 篇草稿
            </span>
          </p>

          <div className="bg-eva-surface border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      文章
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      浏览量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{post.title}</div>
                          <div className="text-sm text-gray-400 font-mono">/{post.slug}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {post.langs.map((l) => (
                              <span key={l} className="inline-flex px-2 py-0.5 text-xs rounded bg-white/5 text-gray-400">
                                {l.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-eva-accent/20 text-eva-accent">
                          {getCategoryLabel(post.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {post.published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-green-500/20 text-green-400">
                            <Eye className="w-3 h-3" />
                            已发布
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-yellow-500/20 text-yellow-400">
                            <EyeOff className="w-3 h-3" />
                            草稿
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {post.view_count} 次
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          {post.published && (
                            <Link
                              to={`/blog/${post.slug}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="查看"
                              target="_blank"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                          )}
                          <Link
                            to={`/admin/blog/edit/${post.id}`}
                            className="text-eva-secondary hover:text-eva-secondary/80 transition-colors"
                            title="编辑"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {searchQuery ? '没有找到匹配的文章' : '还没有文章，点击上方按钮开始写作！'}
            </div>
          )}
        </>
      )}
    </div>
  );
};
