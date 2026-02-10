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

      // Load puzzles with likes
      const puzzles = await base44.entities.PuzzleCatalog.list('-created_date', 500);
      const sortedPuzzles = puzzles
        .map(p => ({
          ...p,
          total_engagement: (p.total_likes || 0) + (p.total_superlikes || 0) * 2
        }))
        .sort((a, b) => b.total_engagement - a.total_engagement);

      setTopPuzzles(sortedPuzzles);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

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
            <h3 className="text-xl font-semibold text-white mb-4">Puzzles triés par Engagement</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {topPuzzles.map((puzzle, index) => (
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
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-orange-400 font-bold">❤️ {puzzle.total_likes || 0}</div>
                        <div className="text-white/50 text-xs">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-pink-400 font-bold">⭐ {puzzle.total_superlikes || 0}</div>
                        <div className="text-white/50 text-xs">Superlikes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold">{puzzle.total_engagement}</div>
                        <div className="text-white/50 text-xs">Score</div>
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