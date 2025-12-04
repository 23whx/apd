import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Edit, Trash2, AlertCircle, Search } from 'lucide-react';
import type { Work } from '../lib/types';

export const AdminWorksPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
      fetchWorks();
    }
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin' || data?.role === 'mod');
  };

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workId: string, workName: string) => {
    if (!confirm(`确定要删除作品「${workName}」吗？此操作不可撤销！`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', workId);

      if (error) throw error;

      alert('删除成功！');
      fetchWorks();
    } catch (error: any) {
      alert('删除失败：' + error.message);
    }
  };

  const filteredWorks = works.filter(work =>
    work.name_cn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.name_jp?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <Link to="/" className="text-eva-secondary hover:underline">返回首页</Link>
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
      <h1 className="text-4xl font-bold mb-2">管理作品</h1>
      <p className="text-gray-400 mb-8">编辑或删除数据库中的作品</p>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索作品名称..."
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
          <p className="text-gray-400 mb-4">共 {filteredWorks.length} 部作品</p>
          
          <div className="bg-eva-surface border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      作品
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      类型
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
                  {filteredWorks.map((work) => (
                    <tr key={work.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-white">{work.name_cn}</div>
                          {work.name_en && (
                            <div className="text-sm text-gray-400">{work.name_en}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1 flex-wrap">
                          {(Array.isArray(work.type) ? work.type : [work.type]).map((type) => (
                            <span
                              key={type}
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-eva-secondary/20 text-eva-secondary"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(work.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <Link
                            to={`/admin/works/${work.id}/edit`}
                            className="text-eva-secondary hover:text-eva-secondary/80 transition-colors"
                            title="编辑"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(work.id, work.name_cn)}
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

          {filteredWorks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {searchQuery ? '没有找到匹配的作品' : '还没有作品'}
            </div>
          )}
        </>
      )}
    </div>
  );
};

