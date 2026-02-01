import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, UserCheck, Puzzle, Bookmark, BookmarkCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';
import UserProfileDialog from './UserProfileDialog';
import UserBadge from '@/components/shared/UserBadge';

function PostAuthorAvatar({ authorEmail, authorInitials, onClick }) {
  const [authorUser, setAuthorUser] = useState(null);

  useEffect(() => {
    loadAuthorUser();
  }, [authorEmail]);

  const loadAuthorUser = async () => {
    try {
      const users = await base44.entities.User.filter({ email: authorEmail });
      if (users.length > 0) {
        setAuthorUser(users[0]);
      }
    } catch (error) {
      console.error('Error loading author:', error);
    }
  };

  return (
    <button onClick={onClick}>
      <Avatar className="h-10 w-10 ring-2 ring-orange-500/20 cursor-pointer hover:ring-orange-500/40 transition-all">
        {authorUser?.profile_photo ? (
          <img src={authorUser.profile_photo} alt={authorEmail} className="w-full h-full object-cover" />
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
            {authorInitials}
          </AvatarFallback>
        )}
      </Avatar>
    </button>
  );
}

export default function PostCard({ post, user }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const isOwnPost = user && post.created_by === user.email;
  const showWishlistButton = !isOwnPost && post.is_completion_post && post.puzzle_name && user;

  useEffect(() => {
    if (user) {
      checkIfLiked();
      checkIfFollowing();
      if (showWishlistButton) {
        checkIfInWishlist();
      }
    }
  }, [post.id, user?.email]);

  const checkIfLiked = async () => {
    if (!user) return;
    const likes = await base44.entities.Like.filter({
      post_id: post.id,
      user_id: user.email
    });
    setIsLiked(likes.length > 0);
  };

  const checkIfFollowing = async () => {
    if (!user || isOwnPost) return;
    const follows = await base44.entities.Follow.filter({
      follower_email: user.email,
      following_email: post.created_by
    });
    setIsFollowing(follows.length > 0);
  };

  const checkIfInWishlist = async () => {
    if (!user) return;
    const existing = await base44.entities.UserPuzzle.filter({
      puzzle_name: post.puzzle_name,
      created_by: user.email,
      status: 'wishlist'
    });
    setIsInWishlist(existing.length > 0);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Connectez-vous pour aimer les posts');
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
      toast.error('Échec de la mise à jour du like');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter à la wishlist');
      return;
    }

    try {
      if (isInWishlist) {
        const existing = await base44.entities.UserPuzzle.filter({
          puzzle_name: post.puzzle_name,
          created_by: user.email,
          status: 'wishlist'
        });
        if (existing.length > 0) {
          await base44.entities.UserPuzzle.delete(existing[0].id);
          setIsInWishlist(false);
          toast.success('Retiré de votre wishlist');
        }
      } else {
        await base44.entities.UserPuzzle.create({
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand || '',
          puzzle_pieces: post.puzzle_pieces || 0,
          puzzle_reference: post.puzzle_reference || '',
          image_url: post.image_url || '',
          status: 'wishlist'
        });
        setIsInWishlist(true);
        toast.success('Ajouté à votre wishlist!');
      }
    } catch (error) {
      console.error('Error managing wishlist:', error);
      toast.error('Échec de la mise à jour de la wishlist');
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Connectez-vous pour suivre des utilisateurs');
      return;
    }

    try {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: user.email,
          following_email: post.created_by
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
          setIsFollowing(false);
          toast.success('Vous ne suivez plus cet utilisateur');
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: post.created_by
        });
        setIsFollowing(true);
        toast.success('Vous suivez maintenant cet utilisateur!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Échec de la mise à jour du suivi');
    }
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
        <PostAuthorAvatar authorEmail={post.created_by} authorInitials={authorInitials} onClick={() => setShowUserProfile(true)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setShowUserProfile(true)}
              className="font-medium text-white hover:text-orange-400 transition-colors text-sm"
            >
              {post.author_name}
            </button>
            <UserBadge userEmail={post.created_by} size="xs" showLabel={false} />
            {post.is_completion_post && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <Puzzle className="w-3 h-3 mr-1" />
                Puzzle complété
              </Badge>
            )}
          </div>
          <p className="text-white/40 text-xs">{timeAgo}</p>
        </div>
        {user && !isOwnPost && (
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
                Suivi
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 mr-1" />
                Suivre
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
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Puzzle className="w-4 h-4 text-orange-400" />
                  <p className="text-white font-medium text-sm">{post.puzzle_name}</p>
                </div>
                <div className="space-y-0.5 text-xs text-white/60">
                  {post.puzzle_brand && <p>Marque: {post.puzzle_brand}</p>}
                  {post.puzzle_pieces && <p>Pièces: {post.puzzle_pieces}</p>}
                  {post.puzzle_category && <p>Catégorie: {post.puzzle_category}</p>}
                  {post.puzzle_reference && <p>Réf: {post.puzzle_reference}</p>}
                </div>
              </div>
              {showWishlistButton && (
                <Button
                  onClick={handleAddToWishlist}
                  size="sm"
                  variant="ghost"
                  className={`rounded-lg h-8 px-3 ${
                    isInWishlist 
                      ? 'text-orange-400 bg-orange-500/20 hover:bg-orange-500/30' 
                      : 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                  }`}
                >
                  {isInWishlist ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-1" />
                      Dans la wishlist
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-1" />
                      Wishlist
                    </>
                  )}
                </Button>
              )}
            </div>
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