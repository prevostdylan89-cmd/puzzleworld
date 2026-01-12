import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, TrendingUp, Calendar, MessageSquare, ChevronRight, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PuzzleCard from '@/components/shared/PuzzleCard';
import EventCard from '@/components/shared/EventCard';
import PostCard from '@/components/shared/PostCard';
import SectionHeader from '@/components/shared/SectionHeader';
import { base44 } from '@/api/base44Client';

export default function Home() {
  const [featuredPuzzles, setFeaturedPuzzles] = useState([]);
  const [mostPlayedPuzzles, setMostPlayedPuzzles] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me().catch(() => null);
      setCurrentUser(user);

      // Load top puzzles
      const topPuzzles = await base44.entities.GlobalPuzzle.list('-completion_count', 10);
      
      setFeaturedPuzzles(topPuzzles.slice(0, 3).map(p => ({
        title: p.puzzle_name,
        image: p.image_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=400&fit=crop',
        pieces: p.puzzle_pieces,
        difficulty: p.difficulty || 'Medium',
        plays: p.completion_count,
        rating: 4.7,
        creator: p.puzzle_brand || 'Community'
      })));

      setMostPlayedPuzzles(topPuzzles.slice(0, 4).map(p => ({
        title: p.puzzle_name,
        image: p.image_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
        pieces: p.puzzle_pieces,
        difficulty: p.difficulty || 'Medium',
        plays: p.completion_count,
        rating: 4.7,
        creator: p.puzzle_brand || 'Community'
      })));

      // Load latest posts
      const posts = await base44.entities.Post.list('-created_date', 2);
      setLatestPosts(posts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

const monthlyEvents = [
  {
    title: 'Speed Puzzle Challenge',
    description: 'Race against time to complete puzzles faster than anyone else',
    image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&h=200&fit=crop',
    date: 'Jan 15-31',
    participants: 2847,
    timeLeft: '5 days left',
    type: 'challenge'
  },
  {
    title: 'Winter Tournament',
    description: 'Compete in the seasonal championship for exclusive rewards',
    image: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&h=200&fit=crop',
    date: 'Jan 20 - Feb 10',
    participants: 1523,
    timeLeft: '12 days left',
    type: 'tournament'
  },
  {
    title: 'Community Build',
    description: 'Collaborate with others to complete a massive 10,000 piece puzzle',
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=200&fit=crop',
    date: 'Ongoing',
    participants: 892,
    timeLeft: 'Join anytime',
    type: 'community'
  }
];

const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-4 lg:px-8 py-12 lg:py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>New puzzles added daily</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Welcome to the <br />
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Puzzle Community
              </span>
            </h1>
            <p className="text-white/60 text-lg mb-8 max-w-lg">
              Discover, share, and complete puzzles with enthusiasts from around the world.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-6">
                <Play className="w-4 h-4 mr-2" />
                Start Puzzling
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-xl px-6">
                Explore Collection
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Puzzles */}
      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="px-4 lg:px-8 py-8"
      >
        <SectionHeader 
          title="Featured This Month"
          subtitle="Hand-picked puzzles by our curators"
          link="Collection"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {featuredPuzzles.length === 0 ? (
            <p className="text-white/50 col-span-3 text-center py-8">No puzzles yet</p>
          ) : (
            <>
              <motion.div variants={item} className="md:col-span-2 md:row-span-2">
                <PuzzleCard puzzle={featuredPuzzles[0]} variant="featured" />
              </motion.div>
              {featuredPuzzles[1] && (
                <motion.div variants={item}>
                  <PuzzleCard puzzle={featuredPuzzles[1]} variant="default" />
                </motion.div>
              )}
              {featuredPuzzles[2] && (
                <motion.div variants={item}>
                  <PuzzleCard puzzle={featuredPuzzles[2]} variant="default" />
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.section>

      {/* Most Played */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="px-4 lg:px-8 py-8"
      >
        <SectionHeader 
          title="Most Played"
          subtitle="Trending puzzles this week"
          link="Collection"
          icon={TrendingUp}
        />
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mostPlayedPuzzles.length === 0 ? (
            <p className="text-white/50 col-span-4 text-center py-8">No puzzles yet</p>
          ) : (
            mostPlayedPuzzles.map((puzzle, index) => (
              <motion.div key={index} variants={item}>
                <Link to={createPageUrl('PuzzleDetail')}>
                  <PuzzleCard puzzle={puzzle} />
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {/* Monthly Events */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="px-4 lg:px-8 py-8"
      >
        <SectionHeader 
          title="Monthly Events"
          subtitle="Join challenges and tournaments"
          icon={Calendar}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {monthlyEvents.map((event, index) => (
            <motion.div key={index} variants={item}>
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Latest Community Posts */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="px-4 lg:px-8 py-8 pb-12"
      >
        <SectionHeader 
          title="Community Feed"
          subtitle="See what others are sharing"
          link="Social"
          icon={MessageSquare}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {latestPosts.length === 0 ? (
            <p className="text-white/50 col-span-2 text-center py-8">No posts yet</p>
          ) : (
            latestPosts.map((post, index) => (
              <motion.div key={index} variants={item}>
                <PostCard post={post} currentUser={currentUser} />
              </motion.div>
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
}