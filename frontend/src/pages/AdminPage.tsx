import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, MessageSquare, TrendingUp, Database } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorks: 0,
    totalCharacters: 0,
    totalVotes: 0,
    totalComments: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 等待 auth 加载完成后再检查权限
    if (!authLoading) {
      checkAdminAccess();
    }
  }, [authLoading]); // Only depend on authLoading, not user

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        console.error('Admin permission check failed:', error?.message);
        alert('Access denied: Unable to verify your permissions.');
        navigate('/');
        return;
      }

      if (data.role !== 'admin' && data.role !== 'mod') {
        alert(`Access denied!\n\nYour role: ${data.role || 'not set'}\nRequired: admin or mod`);
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchStats();
    } catch (error: any) {
      console.error('Error checking admin access:', error.message);
      alert('An error occurred while verifying permissions.');
      navigate('/');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [users, works, characters, votes, comments] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('works').select('id', { count: 'exact', head: true }),
        supabase.from('characters').select('id', { count: 'exact', head: true }),
        supabase.from('personality_votes').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalWorks: works.count || 0,
        totalCharacters: characters.count || 0,
        totalVotes: votes.count || 0,
        totalComments: comments.count || 0
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 显示加载状态（等待 auth 和权限检查）
  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary mb-4"></div>
          <p className="text-gray-400">
            {authLoading ? 'Loading user...' : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-eva-secondary" />
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={<Users className="w-8 h-8" />}
              title="Total Users"
              value={stats.totalUsers}
              color="text-eva-secondary"
            />
            <StatCard
              icon={<FileText className="w-8 h-8" />}
              title="Total Works"
              value={stats.totalWorks}
              color="text-blue-400"
            />
            <StatCard
              icon={<Database className="w-8 h-8" />}
              title="Total Characters"
              value={stats.totalCharacters}
              color="text-purple-400"
            />
            <StatCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Total Votes"
              value={stats.totalVotes}
              color="text-green-400"
            />
            <StatCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Total Comments"
              value={stats.totalComments}
              color="text-yellow-400"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/admin/works')}
                className="bg-eva-secondary/20 hover:bg-eva-secondary/30 border border-eva-secondary/50 p-4 rounded-lg text-left transition-colors"
              >
                <h3 className="font-bold mb-1">管理作品</h3>
                <p className="text-sm text-gray-400">编辑或删除作品</p>
              </button>
              <button 
                onClick={() => navigate('/admin/characters')}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 p-4 rounded-lg text-left transition-colors"
              >
                <h3 className="font-bold mb-1">管理角色</h3>
                <p className="text-sm text-gray-400">编辑或删除角色</p>
              </button>
              <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 p-4 rounded-lg text-left transition-colors">
                <h3 className="font-bold mb-1">Moderate Comments</h3>
                <p className="text-sm text-gray-400">Review flagged comments</p>
              </button>
              <button className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 p-4 rounded-lg text-left transition-colors">
                <h3 className="font-bold mb-1">Manage Users</h3>
                <p className="text-sm text-gray-400">User roles and permissions</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-eva-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <div className="text-gray-400 text-center py-8">
              Activity log feature coming soon...
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
  return (
    <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
      <div className={`${color} mb-3`}>{icon}</div>
      <div className="text-3xl font-bold mb-1">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );
};

