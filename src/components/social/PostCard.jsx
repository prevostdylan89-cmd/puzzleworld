import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Puzzle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CommentsSection from './CommentsSection';

export default function PostCard({ post, currentUser, onPostUpdated }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkIfLiked();
    checkIfWishlisted();
  }, [post.id, currentUser]);

  const checkIfLiked = async () => {
    if (!currentUser) return;
    try {
      const likes = await base44.entities.Like.filter({
        post_id: post.id,
        user_email: currentUser.email
      });
      setIsLiked(likes.length > 0);
    } catch (error) {
      console.error('Error checking like:', error);
    }
  };

  const checkIfWishlisted = async () => {
    if (!currentUser || post.type !== 'completion') return;
    try {
      const wishlist = await base44.entities.Wishlist.filter({
        post_id: post.id,
        user_email: currentUser.email
      });
      setIsWishlisted(wishlist.length > 0);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isLiked) {
        // Unlike
        const likes = await base44.entities.Like.filter({
          post_id: post.id,
          user_email: currentUser.email
        });
        if (likes[0]) {
          await base44.entities.Like.delete(likes[0].id);
        }
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        await base44.entities.Post.update(post.id, {
          likes_count: Math.max(0, likesCount - 1)
        });
      } else {
        // Like
        await base44.entities.Like.create({
          post_id: post.id,
          user_email: currentUser.email
        });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        await base44.entities.Post.update(post.id, {
          likes_count: likesCount + 1
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWishlist = async () => {
    if (!currentUser || post.type !== 'completion' || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isWishlisted) {
        const wishlist = await base44.entities.Wishlist.filter({
          post_id: post.id,
          user_email: currentUser.email
        });
        if (wishlist[0]) {
          await base44.entities.Wishlist.delete(wishlist[0].id);
        }
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await base44.entities.Wishlist.create({
          user_email: currentUser.email,
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand,
          puzzle_pieces: post.puzzle_pieces,
          image_url: post.image_url,
          post_id: post.id
        });
        setIsWishlisted(true);
        toast.success('Added to wishlist!');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount(prev => prev + 1);
  };

  const authorInitials = post.created_by?.substring(0, 2).toUpperCase() || 'U';
  const timeAgo = format(new Date(post.created_date), 'MMM d, yyyy');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
            {authorInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">{post.created_by}</h4>
          <p className="text-white/40 text-xs">{timeAgo}</p>
        </div>
        {post.type === 'completion' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlist}
            disabled={isProcessing}
            className={`${isWishlisted ? 'text-orange-400' : 'text-white/40'} hover:text-orange-400`}
          >
            <Bookmark className={`w-4 h-4 ${isWishlisted ? 'fill-orange-400' : ''}`} />
          </Button>
        )}
      </div>

      {/* Puzzle Details for Completion Posts */}
      {post.type === 'completion' && post.puzzle_name && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <Puzzle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-white font-medium">{post.puzzle_name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-white/60">
                {post.puzzle_brand && <span>{post.puzzle_brand}</span>}
                {post.puzzle_pieces && (
                  <>
                    <span>•</span>
                    <span>{post.puzzle_pieces} pieces</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag, i) => (
              <span key={i} className="text-orange-400 text-xs">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-xl object-cover max-h-96"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-6">
        <button
          onClick={handleLike}
          disabled={isProcessing}
          className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group"
        >
          <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLiked ? 'fill-orange-400 text-orange-400' : ''}`} />
          <span className="text-sm">{likesCount}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm">{commentsCount}</span>
        </button>
        <button className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group ml-auto">
          <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          currentUser={currentUser}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </motion.div>
  );
}