import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingUp, Heart, Bookmark, ThumbsDown, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PuzzleStatsModal({ open, onClose, puzzle }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    postLikes: 0,
    userLikes: 0,
    wishlistCount: 0,
    posts: []
  });

  useEffect(() => {
    if (open && puzzle?.asin) {
      loadStats();
    }
  }, [open, puzzle]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Récupérer tous les posts liés à ce puzzle
      const posts = await base44.entities.Post.filter({ puzzle_reference: puzzle.asin });
      
      // Compter les likes sur les posts
      let totalPostLikes = 0;
      for (const post of posts) {
        totalPostLikes += post.likes_count || 0;
      }
      
      // Récupérer les UserPuzzleLike
      const userLikes = await base44.entities.UserPuzzleLike.filter({ puzzle_asin: puzzle.asin });
      
      // Récupérer les wishlist
      const wishlistItems = await base44.entities.UserPuzzle.filter({ 
        puzzle_reference: puzzle.asin, 
        status: 'wishlist' 
      });

      setStats({
        postLikes: totalPostLikes,
        userLikes: userLikes.length,
        wishlistCount: wishlistItems.length,
        posts: posts
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!puzzle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Statistiques Sociales</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Puzzle Info */}
            <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <img
                src={puzzle.image_hd}
                alt={puzzle.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">{puzzle.title}</h3>
                <p className="text-white/60 text-sm">
                  {puzzle.brand} • {puzzle.piece_count} pièces
                </p>
                <p className="text-white/40 text-xs mt-2">ASIN: {puzzle.asin}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{puzzle.socialScore || 0}</div>
                    <div className="text-green-400 text-sm font-medium">Score Social</div>
                  </div>
                </div>
                <p className="text-white/50 text-xs">Basé sur les likes des posts</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{puzzle.wishlistCount || 0}</div>
                    <div className="text-orange-400 text-sm font-medium">Wishlist</div>
                  </div>
                </div>
                <p className="text-white/50 text-xs">Utilisateurs intéressés</p>
              </div>

              <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{puzzle.total_likes || 0}</div>
                    <div className="text-pink-400 text-sm font-medium">Likes Puzzle</div>
                  </div>
                </div>
                <p className="text-white/50 text-xs">Likes directs du puzzle</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xl">📝</span>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.posts.length}</div>
                    <div className="text-purple-400 text-sm font-medium">Posts</div>
                  </div>
                </div>
                <p className="text-white/50 text-xs">Publications associées</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-semibold mb-3">Détails des Interactions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Likes sur posts sociaux</span>
                  <span className="text-white font-medium">{stats.postLikes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Likes directs (UserPuzzleLike)</span>
                  <span className="text-white font-medium">{stats.userLikes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Ajouts à la wishlist</span>
                  <span className="text-white font-medium">{stats.wishlistCount}</span>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            {stats.posts.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3">Publications Récentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stats.posts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-start gap-2 text-sm">
                      <Heart className="w-4 h-4 text-pink-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white/80 line-clamp-2">{post.content}</p>
                        <p className="text-white/40 text-xs mt-1">
                          {post.likes_count || 0} likes • {new Date(post.created_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}