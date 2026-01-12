import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  Flame,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import CreatePostForm from '@/components/social/CreatePostForm';
import PostCard from '@/components/social/PostCard';



export default function Social() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('trending');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerTarget = useRef(null);
  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    loadUser();
    loadInitialPosts();
  }, [activeTab]);

  useEffect(() => {
    // Setup intersection observer for infinite scroll
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const loadInitialPosts = async () => {
    setIsLoading(true);
    setPosts([]);
    setPage(0);
    setHasMore(true);
    
    try {
      let sortBy = '-created_date';
      if (activeTab === 'trending') {
        sortBy = '-likes_count';
      }
      
      const postsList = await base44.entities.Post.list(sortBy, POSTS_PER_PAGE);
      setPosts(postsList);
      setHasMore(postsList.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    
    try {
      let sortBy = '-created_date';
      if (activeTab === 'trending') {
        sortBy = '-likes_count';
      }
      
      const morePosts = await base44.entities.Post.list(sortBy, POSTS_PER_PAGE, nextPage * POSTS_PER_PAGE);
      
      if (morePosts.length > 0) {
        setPosts(prev => [...prev, ...morePosts]);
        setPage(nextPage);
        setHasMore(morePosts.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = () => {
    loadInitialPosts();
  };



  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">Community</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger 
                value="trending" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Flame className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger 
                value="latest"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger 
                value="following"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                Following
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            {/* Create Post */}
            {user && (
              <CreatePostForm user={user} onPostCreated={handlePostCreated} />
            )}

            {!user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-6 text-center"
              >
                <p className="text-white/80 mb-3">Please log in to create posts and interact with the community</p>
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full"
                >
                  Log In
                </Button>
              </motion.div>
            )}

            {/* Posts Feed */}
            {isLoading && posts.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/50">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                  />
                ))}
                
                {/* Infinite Scroll Trigger */}
                <div ref={observerTarget} className="py-4">
                  {isLoading && (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <p className="text-white/40 text-sm text-center">You've reached the end!</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 space-y-6">
            {/* Community Guidelines */}
            <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-white/[0.06] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-2">Community Guidelines</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Be respectful, share your passion, and help fellow puzzlers. Let's keep this community awesome! 🧩
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Community Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Total Posts</span>
                  <span className="text-white font-medium">{posts.length}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Active Today</span>
                  <span className="text-orange-400 font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}