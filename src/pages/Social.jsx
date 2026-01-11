import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus,
  Flame,
  Clock,
  TrendingUp,
  Users,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import PostCard from '@/components/social/PostCard';
import CreatePostModal from '@/components/social/CreatePostModal';
import { toast } from 'sonner';

const trendingTags = [
  { tag: 'winterpuzzles', count: 2847 },
  { tag: 'speedrun', count: 1523 },
  { tag: 'landscapes', count: 1289 },
  { tag: 'newyear2024', count: 987 },
  { tag: 'puzzleart', count: 756 }
];

export default function Social() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    loadCurrentUser();
    loadPosts(true);
  }, [activeTab]);

  useEffect(() => {
    // Infinite scroll
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
        && hasMore && !isLoadingMore
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, page]);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPosts = async (reset = false) => {
    try {
      setIsLoading(reset);
      const sortOrder = activeTab === 'latest' ? '-created_date' : '-likes_count';
      const data = await base44.entities.Post.list(sortOrder, POSTS_PER_PAGE);
      setPosts(data);
      setPage(1);
      setHasMore(data.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const sortOrder = activeTab === 'latest' ? '-created_date' : '-likes_count';
      const skip = page * POSTS_PER_PAGE;
      const data = await base44.entities.Post.list(sortOrder, POSTS_PER_PAGE, skip);
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
        setHasMore(data.length === POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts(true);
    toast.success('Post created successfully!');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Community</h1>
            {currentUser && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            )}
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger 
                value="latest" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger 
                value="trending"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Flame className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/50 mb-4">No posts yet</p>
                {currentUser && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Create First Post
                  </Button>
                )}
              </div>
            ) : (
              <>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {posts.map((post) => (
                    <motion.div key={post.id} variants={item}>
                      <PostCard
                        post={post}
                        currentUser={currentUser}
                        onPostUpdated={loadPosts}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                  </div>
                )}

                {/* End of Feed */}
                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/40 text-sm">You've reached the end!</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 space-y-6">
            {/* Trending Tags */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-white">Trending Tags</h3>
              </div>
              <div className="space-y-3">
                {trendingTags.map((item, index) => (
                  <button 
                    key={index}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-orange-400 group-hover:text-orange-300">#{item.tag}</span>
                    <span className="text-white/40 text-sm">{item.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-white">Community</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Total Posts</span>
                  <span className="text-white font-medium">{posts.length}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Active Users</span>
                  <span className="text-white font-medium">1.2K+</span>
                </div>
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-white/[0.06] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-2">Community Guidelines</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Be respectful, share your passion, and help fellow puzzlers. Let's keep this community awesome! 🧩
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
        user={currentUser}
      />
    </div>
  );
}