import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, Loader2, Edit2, Trash2, X, Check, ArrowUpDown } from 'lucide-react';

interface Comment {
  id: string;
  user_id: string;
  content_md: string;
  created_at: string;
  users: {
    username: string;
    avatar_id: number;
  };
}

interface CommentSectionProps {
  targetType: 'work' | 'character' | 'poll';
  targetId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ targetType, targetId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasCommented, setHasCommented] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = 最新在前，asc = 最早在前

  useEffect(() => {
    fetchComments();
  }, [targetId, user, sortOrder]); // Add sortOrder to dependencies

  const fetchComments = async () => {
    setFetchLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, users(username, avatar_id)')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: sortOrder === 'asc' }); // 根据排序顺序

      if (error) throw error;
      setComments(data || []);

      // Check if current user has already commented
      if (user) {
        const userComment = data?.find(c => c.user_id === user.id);
        setHasCommented(!!userComment);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert([
        {
          target_type: targetType,
          target_id: targetId,
          user_id: user.id,
          content_md: newComment.trim()
        }
      ]);

      if (error) {
        // Check if it's a unique constraint violation
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          alert('You have already commented on this item. Please refresh the page.');
        } else {
          alert(`Error: ${error.message}`);
        }
        throw error;
      }

      setNewComment('');
      setHasCommented(true);
      fetchComments();
    } catch (error: any) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content_md);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content_md: editContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setEditingId(null);
      setEditContent('');
      fetchComments();
    } catch (error: any) {
      console.error('Error updating comment:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? You can comment again after deletion.')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // After deletion, user can comment again
      setHasCommented(false);
      fetchComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Format date time to precise seconds
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Sort comments: user's own comment first, then others
  const sortedComments = React.useMemo(() => {
    if (!user) return comments;
    
    const userComments = comments.filter(c => c.user_id === user.id);
    const otherComments = comments.filter(c => c.user_id !== user.id);
    
    return [...userComments, ...otherComments];
  }, [comments, user]);

  return (
    <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-eva-secondary" />
          {t('comments.title')} ({comments.length})
        </h2>
        
        {/* Sort toggle button */}
        {comments.length > 0 && (
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm text-gray-400 hover:text-white"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{sortOrder === 'desc' ? t('comments.sortNewest') : t('comments.sortOldest')}</span>
          </button>
        )}
      </div>

      {/* Comment form */}
      {user ? (
        hasCommented ? (
          <div className="mb-6 p-4 bg-eva-accent/10 border border-eva-accent/30 rounded-lg text-center">
            <p className="text-eva-accent font-medium">
              {t('comments.alreadyCommented')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t('comments.oncePerTarget')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('comments.placeholder')}
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="bg-eva-secondary text-eva-bg px-4 py-2 rounded font-bold hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('comments.posting')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t('comments.postComment')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg text-center text-gray-400">
          {t('comments.loginToComment')}
        </div>
      )}

      {/* Comments list */}
      {fetchLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-eva-secondary"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('comments.noComments')}</div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment, index) => {
            const isOwnComment = user && comment.user_id === user.id;
            // 计算序号：根据排序顺序决定
            const commentNumber = sortOrder === 'desc' 
              ? comments.length - comments.findIndex(c => c.id === comment.id)
              : comments.findIndex(c => c.id === comment.id) + 1;
            
            return (
              <div 
                key={comment.id} 
                className={`bg-black/20 border rounded-lg p-4 ${
                  isOwnComment ? 'border-eva-accent/50 bg-eva-accent/5' : 'border-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Comment Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-eva-secondary/20 flex items-center justify-center">
                    <span className="text-eva-secondary font-bold text-sm">#{commentNumber}</span>
                  </div>
                  
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-eva-secondary/30">
                    <img
                      src={`/userAvatar/${comment.users.avatar_id.toString().padStart(2, '0')}-${
                        ['御坂美琴', '夏娜', '立华奏', '亚丝娜', '雪之下雪乃', 
                         '灰原哀', '时崎狂三', '秋山澪', '波奇', '千早爱音',
                         '四宫辉夜', '樱岛麻衣', '黑岩射手', '初音未来', '牧濑红莉栖',
                         '蕾姆', 'Saber', 'CC', '小圆', '春日野穹'][comment.users.avatar_id - 1]
                      }.png`}
                      alt={`Avatar ${comment.users.avatar_id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback: show avatar_id number if image fails to load
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.avatar-fallback')) {
                          parent.classList.add('bg-eva-secondary/20', 'flex', 'items-center', 'justify-center');
                          const fallback = document.createElement('span');
                          fallback.className = 'text-eva-secondary font-bold avatar-fallback';
                          fallback.textContent = comment.users.avatar_id.toString();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">
                          {comment.users.username}
                          {isOwnComment && (
                            <span className="ml-2 text-xs bg-eva-accent/20 text-eva-accent px-2 py-0.5 rounded">
                              {t('comments.you')}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>
                      
                      {/* Edit/Delete buttons - only show for own comments */}
                      {isOwnComment && (
                        <div className="flex items-center gap-2">
                          {editingId === comment.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(comment.id)}
                                className="text-eva-secondary hover:text-eva-secondary/80 transition-colors"
                                title={t('comments.save')}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-400 hover:text-white transition-colors"
                                title={t('comments.cancel')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(comment)}
                                className="text-gray-400 hover:text-white transition-colors"
                                title={t('comments.edit')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title={t('comments.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Comment content - editable if in edit mode */}
                    {editingId === comment.id ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-eva-secondary resize-none"
                      />
                    ) : (
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content_md}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

