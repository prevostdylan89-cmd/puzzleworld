import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CommentsSection({ postId, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const data = await base44.entities.Comment.filter({ post_id: postId }, '-created_date');
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await base44.entities.Comment.create({
        post_id: postId,
        content: newComment.trim(),
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email
      });

      setComments([comment, ...comments]);
      setNewComment('');
      onCommentAdded();
      
      // Update post comment count
      const post = await base44.entities.Post.filter({ id: postId });
      if (post[0]) {
        await base44.entities.Post.update(postId, {
          comments_count: (post[0].comments_count || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-4 border-t border-white/[0.06] pt-4 space-y-4">
      {/* Add Comment */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
              {currentUser.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-white/40 text-sm text-center py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-purple-500/20">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                  {comment.user_name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">{comment.user_name}</span>
                  <span className="text-white/40 text-xs">
                    {format(new Date(comment.created_date), 'MMM d, HH:mm')}
                  </span>
                </div>
                <p className="text-white/80 text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}