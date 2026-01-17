import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, UserCheck, Puzzle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';
import UserProfileDialog from './UserProfileDialog';

export default function PostCard({ post, user }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [post.id, user?.email]);

  const checkIfLiked = async () => {
    if (!user) return;
    
    const likes = await base44.entities.Like.filter({
      post_id: post.id,
      user_id: user.email
    });
    setIsLiked(likes.length > 0);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    setIsProcessing(true);
    try {
      if (isLiked) {
        const likes = await base44.entities.Like.filter({
          post_id: post.id,
          user_id: user.email
        });
        if (likes.length > 0) {
          await base44.entities.Like.delete(likes[0].id);
          setIsLiked(false);
          const newCount = Math.max(0, likesCount - 1);
          setLikesCount(newCount);
          await base44.entities.Post.update(post.id, { likes_count: newCount });
        }
      } else {
        await base44.entities.Like.create({
          post_id: post.id,
          user_id: user.email
        });
        setIsLiked(true);
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        await base44.entities.Post.update(post.id, { likes_count: newCount });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please log in to add to wishlist');
      return;
    }

    if (!post.is_completion_post || !post.puzzle_name) {
      toast.error('This post does not contain puzzle details');
      return;
    }

    try {
      const existing = await base44.entities.Wishlist.filter({
        puzzle_name: post.puzzle_name,
        created_by: user.email
      });

      if (existing.length > 0) {
        toast.info('This puzzle is already in your wishlist');
        return;
      }

      await base44.entities.Wishlist.create({
        puzzle_name: post.puzzle_name,
        puzzle_brand: post.puzzle_brand || '',
        puzzle_pieces: post.puzzle_pieces || 0,
        image_url: post.image_url || '',
        priority: 'medium'
      });

      toast.success('Added to wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const handleFollow = () => {
    if (!user) {
      toast.error('Please log in to follow users');
      return;
    }
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 'Unfollowed' : 'Following!');
  };

  const handleCommentAdded = () => {
    setCommentsCount(commentsCount + 1);
  };

  const authorInitials = post.author_name 
    ? post.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const timeAgo = post.created_date 
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : 'just now';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <button onClick={() => setShowUserProfile(true)}>
          <Avatar className="h-10 w-10 ring-2 ring-orange-500/20 cursor-pointer hover:ring-orange-500/40 transition-all">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setShowUserProfile(true)}
              className="font-medium text-white hover:text-orange-400 transition-colors text-sm"
            >
              {post.author_name}
            </button>
            {post.is_completion_post && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <Puzzle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <p className="text-white/40 text-xs">{timeAgo}</p>
        </div>
        {user && post.created_by !== user.email && (
          <Button 
            onClick={handleFollow}
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            className={`rounded-full text-xs h-7 px-3 ${
              isFollowing 
                ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-3 h-3 mr-1" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Puzzle Details */}
      {post.is_completion_post && post.puzzle_name && (
        <div className="px-4 pb-3">
          <div className="flex items-start justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-orange-400" />
                <p className="text-white font-medium text-sm">{post.puzzle_name}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                {post.puzzle_brand && <span>{post.puzzle_brand}</span>}
                {post.puzzle_brand && post.puzzle_pieces && <span>•</span>}
                {post.puzzle_pieces && <span>{post.puzzle_pieces} pieces</span>}
              </div>
            </div>
            {user && (
              <Button
                onClick={handleAddToWishlist}
                size="sm"
                variant="ghost"
                className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg h-7 px-2 ml-2"
              >
                <Heart className="w-4 h-4 mr-1" />
                Wishlist
              </Button>
            )}
          </div>
        </div>
      )}

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
          className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group disabled:opacity-50"
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
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          post={post} 
          user={user} 
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* User Profile Dialog */}
      {showUserProfile && (
        <UserProfileDialog 
          userEmail={post.created_by} 
          onClose={() => setShowUserProfile(false)} 
        />
      )}
    </motion.div>
  );
}