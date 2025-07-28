'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Heart, Reply, MoreVertical, Edit, Trash2, Flag, User } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  prompt_id: string;
  parent_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  user_profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface CommentsSectionProps {
  promptId: string;
  currentUserId?: string;
  initialComments?: Comment[];
}

export default function CommentsSection({
  promptId,
  currentUserId,
  initialComments = []
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const supabase = createClientSupabaseClient();

  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    }
  }, [promptId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          prompt_id,
          parent_id,
          is_edited,
          is_deleted,
          user_profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('prompt_id', promptId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data?.forEach(comment => {
        const commentWithReplies = { ...comment, replies: [] };
        commentMap.set(comment.id, commentWithReplies);

        if (!comment.parent_id) {
          rootComments.push(commentWithReplies);
        }
      });

      // Add replies to their parent comments
      data?.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentMap.get(comment.id)!);
          }
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId || !newComment.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompt_comments')
        .insert({
          content: newComment.trim(),
          user_id: currentUserId,
          prompt_id: promptId,
        })
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          prompt_id,
          parent_id,
          is_edited,
          is_deleted,
          user_profiles (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, { ...data, replies: [] }]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    
    if (!currentUserId || !replyContent.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompt_comments')
        .insert({
          content: replyContent.trim(),
          user_id: currentUserId,
          prompt_id: promptId,
          parent_id: parentId,
        })
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          prompt_id,
          parent_id,
          is_edited,
          is_deleted,
          user_profiles (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add reply to the parent comment
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), data]
          };
        }
        return comment;
      }));

      setReplyingTo(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('prompt_comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, content: editContent.trim(), is_edited: true };
        }
        // Check replies
        return {
          ...comment,
          replies: comment.replies?.map(reply => 
            reply.id === commentId 
              ? { ...reply, content: editContent.trim(), is_edited: true }
              : reply
          ) || []
        };
      }));

      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('prompt_comments')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (error) throw error;

      // Remove from local state
      setComments(prev => prev.filter(comment => {
        if (comment.id === commentId) return false;
        // Also remove from replies
        comment.replies = comment.replies?.filter(reply => reply.id !== commentId) || [];
        return true;
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={cn("flex space-x-3", isReply && "ml-12")}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user_profiles?.avatar_url ? (
          <img
            src={comment.user_profiles.avatar_url}
            alt={comment.user_profiles.full_name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {comment.user_profiles?.full_name || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
                {comment.is_edited && ' (edited)'}
              </span>
            </div>

            {/* Comment Menu */}
            {currentUserId && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === comment.id ? null : comment.id)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu === comment.id && (
                  <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                    {comment.user_id === currentUserId ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                            setShowMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteComment(comment.id);
                            setShowMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowMenu(null)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Form */}
          {editingComment === comment.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditComment(comment.id);
              }}
              className="space-y-2"
            >
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-900 text-sm">{comment.content}</p>
          )}
        </div>

        {/* Comment Actions */}
        {!isReply && currentUserId && editingComment !== comment.id && (
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center hover:text-gray-700"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </button>
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <form
            onSubmit={(e) => handleSubmitReply(e, comment.id)}
            className="mt-3 space-y-2"
          >
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !replyContent.trim()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </form>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <MessageCircle className="w-5 h-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-md text-center">
          <p className="text-gray-600 mb-2">Sign in to join the conversation</p>
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Click overlay to close menus */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
}

