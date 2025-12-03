import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

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
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [targetId]);

  const fetchComments = async () => {
    setFetchLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, users(username, avatar_id)')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
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

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error: any) {
      console.error('Error posting comment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-eva-secondary" />
        Comments ({comments.length})
      </h2>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
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
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg text-center text-gray-400">
          Please login to comment
        </div>
      )}

      {/* Comments list */}
      {fetchLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-eva-secondary"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No comments yet</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-black/20 border border-white/5 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-eva-secondary/20 flex items-center justify-center text-eva-secondary font-bold flex-shrink-0">
                  {comment.users.avatar_id}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{comment.users.username}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content_md}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

