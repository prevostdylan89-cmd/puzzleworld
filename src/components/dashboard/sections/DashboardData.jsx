import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, Heart, Loader2, ChevronRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import PuzzleAnalyticsModal from '@/components/dashboard/PuzzleAnalyticsModal';

export default function DashboardData() {
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState([]);
  const [topPuzzles, setTopPuzzles] = useState([]);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [sortBy, setSortBy] = useState('score');
  const [pieceFilter, setPieceFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all users
      const users = await base44.entities.User.list();
      
      // Load user stats
      const usersWithStats = await Promise.all(users.map(async (user) => {
        const [completedPuzzles, posts, followers] = await Promise.all([
          base44.entities.CompletedPuzzle.filter({ created_by: user.email }),
          base44.entities.Post.filter({ created_by: user.email }),
          base44.entities.Follow.filter({ following_email: user.email })
        ]);

        return {
          ...user,
          completed_count: completedPuzzles.length,
          posts_count: posts.length,
          followers_count: followers.length
        };
      }));

      // Sort by completed puzzles
      const sortedUsers = usersWithStats.sort((a, b) => 
        (b.completed_count + b.posts_count + b.followers_count) - 
        (a.completed_count + a.posts_count + a.followers_count)
      ).slice(0, 20);

      setTopUsers(sortedUsers);

      // Load all puzzles
      const puzzles = await base44.entities.PuzzleCatalog.list('-created_date', 1000);
      
      // Count real likes for each puzzle with complete scoring system
      const puzzlesWithRealLikes = await Promise.all(puzzles.map(async (puzzle) => {
        try {
          const [likes, swipes] = await Promise.all([
            base44.entities.UserPuzzleLike.filter({ puzzle_asin: puzzle.asin }),
            base44.entities.SwipeInteraction.filter({ puzzle_asin: puzzle.asin })
          ]);
          
          // Count interactions by type (unique per user)
          const uniqueSwipeLikes = new Map();
          const uniqueSwipeSuperlikes = new Map();
          const uniqueSwipeDislikes = new Map();
          
          swipes.forEach(s => {
            if (s.interaction_type === 'like') {
              uniqueSwipeLikes.set(s.created_by, true);
            } else if (s.interaction_type === 'superlike') {
              uniqueSwipeSuperlikes.set(s.created_by, true);
            } else if (s.interaction_type === 'dislike') {
              uniqueSwipeDislikes.set(s.created_by, true);
            }
          });
          
          const likeCount = uniqueSwipeLikes.size;
          const superlikeCount = uniqueSwipeSuperlikes.size;
          const dislikeCount = uniqueSwipeDislikes.size;
          const uniquePostLikes = likes.length;
          
          const totalInteractions = likeCount + superlikeCount + dislikeCount + uniquePostLikes;
          
          // Score sur 100: dislike=0pts, like=75pts, superlike=100pts
          let popularityScore = 0;
          if (totalInteractions > 0) {
            const scoreSum = (likeCount * 75) + (superlikeCount * 100) + (uniquePostLikes * 75) + (dislikeCount * 0);
            popularityScore = Math.round(scoreSum / totalInteractions);
          }
          
          return {
            ...puzzle,
            like_count: likeCount,
            superlike_count: superlikeCount,
            dislike_count: dislikeCount,
            post_like_count: uniquePostLikes,
            popularity_score: popularityScore,
            total_interactions: totalInteractions
          };
        } catch (error) {
          return {
            ...puzzle,
            like_count: 0,
            superlike_count: 0,
            dislike_count: 0,
            post_like_count: 0,
            total_score: 0,
            total_interactions: 0
          };
        }
      }));
      
      const sortedPuzzles = puzzlesWithRealLikes.sort((a, b) => b.popularity_score - a.popularity_score);

      setTopPuzzles(sortedPuzzles);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted puzzles
  const getFilteredPuzzles = () => {
    let filtered = [...topPuzzles];
    
    // Filter by piece count
    if (pieceFilter !== 'all') {
      const targetPieces = parseInt(pieceFilter);
      filtered = filtered.filter(p => p.piece_count === targetPieces);
    }
    
    // Sort
    switch (sortBy) {
      case 'score':
        filtered.sort((a, b) => b.popularity_score - a.popularity_score);
        break;
      case 'wishlist':
        filtered.sort((a, b) => b.wishlist_count - a.wishlist_count);
        break;
      case 'likes':
        filtered.sort((a, b) => b.like_count - a.like_count);
        break;
      default:
        break;
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  const filteredPuzzles = getFilteredPuzzles();
  const availablePieceCounts = [...new Set(topPuzzles.map(p => p.piece_count))].sort((a, b) => a - b);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Données & Analytics</h2>
        <p className="text-white/60">Statistiques détaillées pour collaborations B2B</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="users" className="data-[state=active]:bg-orange-500">
            <Users className="w-4 h-4 mr-2" />
            Top Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="puzzles" className="data-[state=active]:bg-orange-500">
            <Heart className="w-4 h-4 mr-2" />
            Puzzles par Likes
          </TabsTrigger>
        </TabsList>

        {/* Top Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Top 20 Utilisateurs Actifs</h3>
            <div className="space-y-2">
              {topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{user.full_name || user.email}</h4>
                      <p className="text-white/50 text-sm">{user.email}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-orange-400 font-bold">{user.completed_count}</div>
                        <div className="text-white/50 text-xs">Puzzles finis</div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-400 font-bold">{user.posts_count}</div>
                        <div className="text-white/50 text-xs">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-400 font-bold">{user.followers_count}</div>
                        <div className="text-white/50 text-xs">Followers</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Top Puzzles Tab */}
        <TabsContent value="puzzles" className="space-y-4">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Puzzles - {filteredPuzzles.length} résultats</h3>
              
              <div className="flex gap-3">
                {/* Sort By */}
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="score">Trier par Score</option>
                  <option value="superlikes">Trier par Superlikes</option>
                  <option value="likes">Trier par Likes</option>
                </select>

                {/* Filter by Pieces */}
                <select 
                  value={pieceFilter}
                  onChange={(e) => setPieceFilter(e.target.value)}
                  className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Toutes les pièces</option>
                  {availablePieceCounts.map(count => (
                    <option key={count} value={count}>{count} pièces</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPuzzles.map((puzzle, index) => (
                <div
                  key={puzzle.id}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-orange-500/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedPuzzle(puzzle)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <img
                      src={puzzle.image_hd}
                      alt={puzzle.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium line-clamp-1">{puzzle.title}</h4>
                      <p className="text-white/50 text-xs">
                        {puzzle.brand} • {puzzle.piece_count} pièces • {puzzle.category_tag}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">❤️ {puzzle.like_count || 0}</div>
                        <div className="text-white/50 text-xs">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-400 font-bold">⭐ {puzzle.superlike_count || 0}</div>
                        <div className="text-white/50 text-xs">Superlikes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-bold">👎 {puzzle.dislike_count || 0}</div>
                        <div className="text-white/50 text-xs">Dislikes</div>
                      </div>
                      <div className="text-center min-w-[80px]">
                        <div className={`text-2xl font-bold ${
                          puzzle.popularity_score >= 80 ? 'text-green-400' :
                          puzzle.popularity_score >= 50 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {puzzle.popularity_score || 0}
                        </div>
                        <div className="text-white/50 text-xs">/ 100</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Puzzle Analytics Modal */}
      {selectedPuzzle && (
        <PuzzleAnalyticsModal
          open={!!selectedPuzzle}
          onClose={() => setSelectedPuzzle(null)}
          puzzle={selectedPuzzle}
        />
      )}
    </div>
  );
}